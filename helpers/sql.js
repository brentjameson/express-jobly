const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/**
 * Accepts an objecte of JSON data intended to update a datbase record and an object where the keys are json and the value is the matching SQL syntax
 * Returns an object where setCols is a SQL statement setting parameters and values is an array of the parameter values
 * {setCols: '"col1"=$1, "col2"=$2, "col3"=$3',
  values: [ 'Value1', Value2, Value3 ]}
 * 


 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  console.log('i am keys:', keys)

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  const x = {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
  console.log('i am return values for sqlforpartialupdate', x)

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
