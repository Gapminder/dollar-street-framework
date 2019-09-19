import * as shell from 'shelljs';
import * as _ from 'lodash';
import * as nodemailer from 'nodemailer';

const args = process.argv.splice(2);
const user = args.shift();
const password = args.shift();
const dbs = _.uniq(args);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASSWORD
  }
});

_.forEach(dbs, async (db) => {
  try {
    const resultMem = shell.exec(
      `mongo mongodb://${user}:${password}@${db}:27017/admin --quiet --eval "db.serverStatus().mem"`
    );
    const { code: codeMem, stderr: stderrMem, stdout: stdoutMem } = resultMem;
    if (codeMem || stderrMem) {
      throw new Error(`[code=${codeMem}] Shelljs returned error: ${stderrMem}`);
    }
    const memory = JSON.parse(stdoutMem);
    const memoryHighThreshold = 5000;
    if (memory.resident > memoryHighThreshold) {
      throw new Error(
        `[WARN] Instance has too low value for memory.resident:\n ${memory.resident} > ${memoryHighThreshold}`
      );
    }
    if (memory.virtual > memoryHighThreshold) {
      throw new Error(
        `[WARN] Instance has too low value for memory.virtual:\n ${memory.virtual} > ${memoryHighThreshold}`
      );
    }

    //db.serverStatus().repl.hosts 3 items
    //db.serverStatus().metrics.getLastError
    //const resultConnections = shell.exec(`mongo mongodb://${user}:${password}@${db}:27017/admin --quiet --eval "db.serverStatus().connections"`);
    //const resultFreeMonitoring = shell.exec(`mongo mongodb://${user}:${password}@${db}:27017/admin --quiet --eval "db.serverStatus().freeMonitoring"`);

    //https://www.bmc.com/blogs/mongodb-memory-usage-and-management/
    const resultTcmalloc = shell.exec(
      `mongo mongodb://${user}:${password}@${db}:27017/admin --quiet --eval "var mem = db.serverStatus().tcmalloc; \n delete mem.tcmalloc.formattedString; \n delete mem.tcmalloc.pageheap_total_commit_bytes; \n delete mem.tcmalloc.pageheap_total_decommit_bytes; \n delete mem.tcmalloc.pageheap_total_reserve_bytes; \n delete mem.tcmalloc.max_total_thread_cache_bytes; \n delete mem.tcmalloc.spinlock_total_delay_ns; \n delete mem.tcmalloc.pageheap_committed_bytes; \n mem.tcmalloc"`
    );
    const { code: codeMalloc, stderr: stderrMalloc, stdout: stdoutMalloc } = resultTcmalloc;
    if (codeMalloc || stderrMalloc) {
      throw new Error(`[code=${codeMalloc}] Shelljs returned error: ${stderrMalloc}`);
    }
    const tcmalloc = JSON.parse(stdoutMalloc);
    const pageheapUnmappedBytesLowThreshold = 5000000;
    if (tcmalloc.pageheap_unmapped_bytes < pageheapUnmappedBytesLowThreshold) {
      throw new Error(
        `[WARN] Instance has too low value for tcmalloc.pageheap_unmapped_bytes:\n ${
          tcmalloc.pageheap_unmapped_bytes
        } < ${pageheapUnmappedBytesLowThreshold}`
      );
    }
    //throw new Error('Something went wrong');
  } catch (error) {
    console.error(error);
    shell.exec(`( speaker-test -t sine -f 1000 )& pid=$! ; sleep 5s ; kill -9 $pid`);
    await sendEmails(error);
  }
});

async function sendEmails(error) {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: 'alexandra.kalinina@valor-software.com', // sender address
      to: process.env.ADMIN_TARGET, // list of receivers
      subject: 'DOLLAR STREET DB ALARM!!!!', // Subject line
      html: `<pre>${process.env.ADMIN_EMAIL_TEMPLATE}. ${error}</pre>` // plain text body
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        return reject(err);
      }

      console.log(info);

      return resolve();
    });
  });
}
