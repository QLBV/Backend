import winston from "winston";
import path from "path";


const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};


const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};


winston.addColors(colors);


const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);


const transports = [
  
  new winston.transports.Console({
    format: format,
  }),
  
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/error.log"),
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/combined.log"),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
  
  exitOnError: false,
});


export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
