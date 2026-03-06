import logging
import sys
from pathlib import Path
from loguru import logger

from app.core.config import settings


class InterceptHandler(logging.Handler):
    """
    Routes all standerd-library logging calls through loguru.
    This ensure uvicorn , SQLAlchemy and other libraries 
    user the same log format and destination.
    """

    def emit(self, record : logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame , depth = sys._getframe(6),6 
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth , exception= record.exc_info).log(
            level , record.getMessage()
        )       

def setup_logging() -> None:
    """
    Configure loguru for the entire application.
    Call this ONCE startup in main.py
    """

    logger.remove()

    log_format = (
        "<green>{time: YYYY-MM-DD HH:mm:ss.SSS} </green> |"
        "<level>{level: <8}</level> |"
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>"
    )

    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=settings.DEBUG,
        diagnose=settings.DEBUG,
    )

    if settings.LOG_FILE:
        log_path = Path(settings.LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        logger.add(
            settings.LOG_FILE,
            format=log_format,
            level=settings.LOG_LEVEL,
            rotation="10 MB",
            retention="7 days",
            compression="zip",
            backtrace=True,
            diagnose=False,
        )
    
    logging.basicConfig(handlers=[InterceptHandler()], level=0 ,force=True)

    for noisy in ["uvicorn", "uvicorn.access" ,"sqlalchemy.engine"]:
        logging.getLogger(noisy).setLevel(
            logging.DEBUG if settings.DEBUG else logging.WARNING
        )

    logger.info(
        "Logging initialised | environment={} | level={}",
        settings.ENVIRONMENT,
        settings.LOG_LEVEL,
    )