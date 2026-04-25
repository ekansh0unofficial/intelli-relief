import logging
import sys
from pathlib import Path

from loguru import logger

from app.core.config import settings

# One consistent format used for both stdout and file sinks.
# {message} was missing in the original — nothing ever printed.
LOG_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level:<8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "{message}"
)


class InterceptHandler(logging.Handler):
    """
    Routes all stdlib logging calls (uvicorn, SQLAlchemy, etc.) through loguru
    so the whole application uses one format and one set of sinks.
    """

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging() -> None:
    """Configure loguru for the entire application. Call once at startup."""
    logger.remove()

    # ── stdout sink ──────────────────────────────────────────────────────────
    logger.add(
        sys.stdout,
        format=LOG_FORMAT,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=settings.DEBUG,
        diagnose=settings.DEBUG,
    )

    # ── file sink ─────────────────────────────────────────────────────────────
    if settings.LOG_FILE:
        log_path = Path(settings.LOG_FILE)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        logger.add(
            settings.LOG_FILE,
            format=LOG_FORMAT,
            level=settings.LOG_LEVEL,
            rotation="10 MB",
            retention="7 days",
            compression="zip",
            backtrace=True,
            diagnose=False,
            encoding="utf-8",
        )

    # ── intercept stdlib loggers ──────────────────────────────────────────────
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    noisy_level = logging.DEBUG if settings.DEBUG else logging.WARNING
    for lib in ("uvicorn", "uvicorn.access", "uvicorn.error", "sqlalchemy.engine"):
        logging.getLogger(lib).setLevel(noisy_level)

    logger.info(
        "Logging initialised | env={} | level={} | file={}",
        settings.ENVIRONMENT,
        settings.LOG_LEVEL,
        settings.LOG_FILE or "stdout only",
    )
