import Nodemailer from 'Nodemailer';
import RestClient from './restClient';

let checkDate = new Date('2017-02-14T00:37:55.088Z');

// get discourse topics
function getDiscourse() {
  return new Promise((resolve, reject) => {
    const restClient = new RestClient();
    restClient.get(process.env.DISCOURSE_URL + '/latest.json').then((results) => {
      if (results && typeof results !== 'object') results = JSON.parse(results);

      if (results && results.topic_list && results.topic_list.topics) {
        return parseTopics(results.topic_list.topics).then(resolve, reject);
      }
      console.error('load error, checkDate not update');
      return reject(error);
    });
  });
}

// parse topics
function parseTopics(topics) {
  const filteredTopics = topics.filter((info) => {
    const created_at = new Date(info.created_at);
    return created_at > checkDate;
  });
  console.log('filteredTopics', JSON.stringify(filteredTopics));
  var p = Promise.resolve();
  return filteredTopics.reduce((pacc, info) => {
    const _subject = info.title;
    const _text = process.env.DISCOURSE_URL + '/t/' + info.id;

    const fn = function () {
      return emailSender(_subject, _text);
    };

    return pacc = pacc.then(fn);
  }, p);
}

// email send
function emailSender(_subject, _text) {
  return new Promise((resolve, reject) => {
    // create reusable transporter object using the default SMTP transport
    let transport = Nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PW
      }
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: _subject,
      text: _text
    };

    console.log('mailOptions', mailOptions);

    // send mail with defined transport object
    transport.sendMail(mailOptions, function(error, info){
      if (error){
        console.error(error);
        return reject(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
      return resolve();
    });
  });
}

// iterator
function iterator() {
  const nextRun = () => {
    checkDate = new Date();
    console.error('success, checkDate update', checkDate);
    // next
    setTimeout(iterator, 10000);
  };
  getDiscourse().then(nextRun, nextRun);
}

// start
iterator();
