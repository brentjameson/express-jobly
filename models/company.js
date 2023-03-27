"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);
    // console.log('newcompany in models', handle, name, description, numEmployees, logoUrl)

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];
    // console.log('company result &&&&&&&&&&&&&&&&&&&&&&', company)

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(searchFilters = {}) {
    let query = `SELECT handle,
                        name,
                        description,
                        num_employees AS "numEmployees",
                        logo_url AS "logoUrl"
                 FROM companies`;
    let whereExpressions = [];
    let queryValues = [];

    const { minEmployees, maxEmployees, name } = searchFilters;

    if (minEmployees > maxEmployees) {
      throw new BadRequestError("Min employees cannot be greater than max");
    }

    // For each possible search term, add to whereExpressions and queryValues so
    // we can generate the right SQL

    if (minEmployees !== undefined) {
      queryValues.push(minEmployees);
      whereExpressions.push(`num_employees >= $${queryValues.length}`);
    }

    if (maxEmployees !== undefined) {
      queryValues.push(maxEmployees);
      whereExpressions.push(`num_employees <= $${queryValues.length}`);
    }

    if (name) {
      queryValues.push(`%${name}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // Finalize query and return results

    query += " ORDER BY name";
    const companiesRes = await db.query(query, queryValues);
    return companiesRes.rows;
  }

  /** Find companies by filter.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  // static async filterQuery(data) {
  //   const {name, minEmployees, maxEmployees} = data

  //   if (Object.keys(data).length === 0) {
  //     return await Company.findAll();
  //   }
  //   else if (Object.keys(data).length === 1) {
  //     if (name) {
  //       return await Company.findByName(name)
  //     }
  //     else if (minEmployees) {
  //       return await Company.findByMinEmployees(minEmployees)
  //     }
  //     else {
  //       return await Company.findByMaxEmployees(maxEmployees)
  //     }
  //   }
  //   else if (Object.keys(data).length === 2) {
  //     if (name && minEmployees) {
  //       return await Company.findByNameAndMin(name, minEmployees)
  //     }
  //     else if (name && maxEmployees) {
  //       return await Company.findByNameAndMax(name, maxEmployees)
  //     }
  //     else {
  //       return await Company.findByMinAndMax(minEmployees, maxEmployees)
  //     }
  //   }
  //   else {
  //     return await Company.findByNameMinMax(name, minEmployees, maxEmployees)
  //   }
  // }

  // /** Find companies by name.
  //  *
  //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //  * */

  // static async findByName(name) {
  //   const companiesRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE POSITION(Lower($1) IN Lower(name))>0
  //          ORDER BY name`,
  //       [name]);
  //   return companiesRes.rows;
  // }

  // /** Find companies by minimum number of employees.
  //  *
  //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //  * */

  // static async findByMinEmployees(minEmployees) {
  //   const companiesRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE num_employees > $1
  //          ORDER BY num_employees`,
  //       [minEmployees]);
  //   return companiesRes.rows;
  // }

  // /** Find companies by maximum number of employees.
  //  *
  //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //  * */

  // static async findByMaxEmployees(maxEmployees) {
  //   const companiesRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE num_employees < $1
  //          ORDER BY num_employees DESC`,
  //       [maxEmployees]);
  //   return companiesRes.rows;
  // }
  
  // /** Find companies by name and minimum number of employees.
  //  *
  //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //  * */

  // static async findByNameAndMin(name, minEmployees) {
  //   const companiesRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE POSITION(Lower($1) IN Lower(name))>0 
  //                AND num_employees > $2
  //          ORDER BY num_employees`,
  //       [name, minEmployees]);
  //   return companiesRes.rows;
  // }

  // /** Find companies by name and maximum number of employees.
  //  *
  //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //  * */

  // static async findByNameAndMax(name, maxEmployees) {
  //   const companiesRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE POSITION(Lower($1) IN Lower(name))>0 
  //                AND num_employees < $2
  //          ORDER BY num_employees DESC`,
  //       [name, maxEmployees]);
  //   return companiesRes.rows;
  // }

  // /** Find companies by minimum and maximum number of employees.
  //  *
  //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //  * */

  // static async findByMinAndMax(minEmployees, maxEmployees) {
  //   const companiesRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE num_employees > $1 
  //                AND num_employees < $2
  //          ORDER BY num_employees`,
  //       [minEmployees, maxEmployees]);
  //   return companiesRes.rows;
  // }

  // /** Find companies by name, minimum number of employees, and maximum number of employees.
  //  *
  //  * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //  * */

  // static async findByNameMinMax(name, minEmployees, maxEmployees) {
  //   const companiesRes = await db.query(
  //         `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE POSITION(Lower($1) IN Lower(name))>0 
  //                AND num_employees > $2 
  //                AND num_employees < $3
  //                ORDER BY num_employees`,
  //       [name, minEmployees, maxEmployees]);
  //   return companiesRes.rows;
  // }

  // /** Given a company handle, return data about company.
  //  *
  //  * Returns { handle, name, description, numEmployees, logoUrl, jobs }
  //  *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
  //  *
  //  * Throws NotFoundError if not found.
  //  **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
