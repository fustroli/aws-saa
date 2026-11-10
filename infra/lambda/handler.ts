import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client, S3ServiceException } from '@aws-sdk/client-s3'
import { createHandler, WriteConflictError, type ProgressStore } from './app'

// Lambda entry point: the sync API backed by one JSON object per sync ID in S3.

const bucket = process.env.BUCKET_NAME
if (!bucket) throw new Error('BUCKET_NAME is not set')

const s3 = new S3Client({})
const key = (id: string) => `progress/${id}.json`

const s3Store: ProgressStore = {
  async get(id) {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key(id) }))
      return { body: await res.Body!.transformToString(), etag: res.ETag! }
    } catch (e) {
      if (e instanceof NoSuchKey) return null
      throw e
    }
  },

  async put(id, body, expectedEtag) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key(id),
          Body: body,
          ContentType: 'application/json',
          // S3 conditional writes: fail instead of overwriting a concurrent update.
          ...(expectedEtag ? { IfMatch: expectedEtag } : { IfNoneMatch: '*' }),
        }),
      )
    } catch (e) {
      // 412 = precondition failed, 409 = another conditional write in progress.
      const status = e instanceof S3ServiceException ? e.$metadata.httpStatusCode : undefined
      if (status === 412 || status === 409) throw new WriteConflictError()
      throw e
    }
  },
}

export const handler = createHandler(s3Store)
