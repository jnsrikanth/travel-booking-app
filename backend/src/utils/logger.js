const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${message}`);
    if (data) console.log(data);
  },
  
  error: (message, error = null) => {
    console.error(`${colors.red}[ERROR] ${message}${colors.reset}`);
    if (error) console.error(error);
  },
  
  debug: (message, data = null) => {
    console.log(`${colors.cyan}[DEBUG] ${message}${colors.reset}`);
    if (data) console.log(data);
  },
  
  success: (message) => {
    console.log(`${colors.green}[SUCCESS] ${message}${colors.reset}`);
  },
  
  warn: (message) => {
    console.log(`${colors.yellow}[WARN] ${message}${colors.reset}`);
  }
};

module.exports = logger; 