import java.io.{ByteArrayInputStream, InputStream}
import java.security.KeyStore
import javax.crypto.SecretKey
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.fs.{FileSystem, Path}

object JCEKSDecryption {
  def main(args: Array[String]): Unit = {
    // HDFS configuration
    val hdfsPath = "hdfs://path/to/your/keystore.jceks"
    val hdfsConf = new Configuration()
    val hdfs = FileSystem.get(hdfsConf)

    // Read the JCEKS file from HDFS
    val inputStream: InputStream = hdfs.open(new Path(hdfsPath))
    val jceksBytes = Stream.continually(inputStream.read()).takeWhile(_ != -1).map(_.toByte).toArray
    inputStream.close()

    // Load the JCEKS keystore
    val keystore = KeyStore.getInstance("JCEKS")
    val keystorePassword = "your_keystore_password".toCharArray
    keystore.load(new ByteArrayInputStream(jceksBytes), keystorePassword)

    // Access the secret key from the keystore
    val alias = "your_secret_key_alias"
    val keyPassword = "your_key_password".toCharArray
    val secretKey = keystore.getKey(alias, keyPassword).asInstanceOf[SecretKey]

    // Print or use the decrypted secret key
    println(s"Decrypted Secret Key: ${new String(secretKey.getEncoded)}")
  }
}
