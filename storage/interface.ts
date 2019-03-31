import * as stream from 'stream';
import { S3 } from 'aws-sdk'

export default interface IStorage {
  list(): Promise<string[]>

  readFile(key: string): stream.Readable

  writeFile(key: string, file: Buffer): Promise<S3.ManagedUpload.SendData>
}