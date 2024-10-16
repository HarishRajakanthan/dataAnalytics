import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.crypto.key.KeyProviderFactory
import org.apache.hadoop.fs.Path

object JCEKSDecryption {
  def main(args: Array[String]): Unit = {
    // HDFS configuration
    val conf = new Configuration()
    
    // Path to the JCEKS file in HDFS
    val jceksPath = "jceks://hdfs/bla/bla/pwd.jceks"
    
    // Initialize the KeyProvider
    val keyProvider = KeyProviderFactory.getProviders(conf).find(_.getConf.get("fs.defaultFS").contains("hdfs")).get
    val provider = keyProvider.getKeyProvider(new Path(jceksPath))
    
    // Alias used to store the credential
    val alias = "blab.alias"
    
    // Retrieve the secret key (password)
    val secretKey = provider.getMetadata(alias)
    val password = new String(secretKey)
    
    // Print or use the password
    println(s"Retrieved Password: $password")
  }
}
