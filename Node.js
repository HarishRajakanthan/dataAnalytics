import org.apache.spark.sql.SparkSession

val spark = SparkSession.builder
  .appName("Create Hive External Table")
  .enableHiveSupport() // Make sure Hive support is enabled
  .getOrCreate()

val df = spark.read
  .option("header", "true")
  .csv("/path/to/your/csv/file")

val tableName = "your_table_name"
val externalLocation = "/path/to/external/location"

val ddlStatement = s"""
  |CREATE EXTERNAL TABLE IF NOT EXISTS $tableName (
  |${df.schema.fields.map(field => s"${field.name} ${field.dataType.sql}").mkString(",\n")}
  |)
  |ROW FORMAT DELIMITED
  |FIELDS TERMINATED BY ','
  |STORED AS TEXTFILE
  |LOCATION '$externalLocation'
  """.stripMargin

spark.sql(ddlStatement)
spark.sql(s"SELECT * FROM $tableName").show()
