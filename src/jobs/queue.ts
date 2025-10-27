import { Queue } from "bullmq";
import { redisInstance } from "config/redisConnection";

const userSignedUpQueue : Queue = new Queue('userSignedUp',{
    connection : redisInstance
});

// const resetPasswordInitiationQueue : Queue = new Queue('resetPassword', {
//     connection: redisInstance
// })
const resetPasswordEmailQueue: Queue = new Queue('forgotPassword', {
    connection: redisInstance
});
export {
    userSignedUpQueue,
    resetPasswordEmailQueue
}