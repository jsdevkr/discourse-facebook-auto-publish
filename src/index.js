require('dotenv').config(); // eslint-disable-line
import { startDaemon as startDaemonFacebook } from './discourseToFacebook.js'; // eslint-disable-line

// start
startDaemonFacebook();
