import * as stream from 'stream';
import { S3 } from 'aws-sdk'
import IStorage from './interface'


type VcapServicesCredentials = {
  aws_access_key_id: string,
  aws_secret_access_key: string,
  aws_region: string,
  bucket_name: string
}

export default class S3Storage implements IStorage {

  private readonly s3: S3
  private readonly bucket: string

  constructor(credentials: VcapServicesCredentials) {
    this.s3 = new S3({
      accessKeyId: credentials.aws_access_key_id,
      secretAccessKey: credentials.aws_secret_access_key,
      region: credentials.aws_region,
      apiVersion: '2006-03-01'
    })
    this.bucket = credentials.bucket_name
  }

  async list(): Promise<string[]> {
    return await this.s3.listObjects({Bucket: this.bucket })
      .promise()
      .then(x => (x.Contents || []).map(y => y.Key || ''))
  }

  readFile(key: string): stream.Readable {
    return this.s3.getObject({Bucket: this.bucket, Key: key}).createReadStream()
  }

  async writeFile(key: string, file: Buffer): Promise<S3.ManagedUpload.SendData> {
    return await this.s3.upload({Bucket: this.bucket, Key: key, Body: file}).promise()
  }

}
