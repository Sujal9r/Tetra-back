export const SHIFT_START_HOUR = 10;
export const SHIFT_END_HOUR = 19;

export const autoClockOutIfNeeded = async (log) => {
  if (!log || log.checkOut) return false;

  const resolveOpenSession = () => {
    if (Array.isArray(log.sessions) && log.sessions.length > 0) {
      const open = [...log.sessions].reverse().find((session) => !session.checkOut);
      if (open) return open;
    }
    return null;
  };

  const openSession = resolveOpenSession();
  const checkInTime = openSession ? new Date(openSession.checkIn) : new Date(log.checkIn);
  const endTime = new Date(checkInTime);
  endTime.setHours(SHIFT_END_HOUR, 0, 0, 0);

  if (new Date() >= endTime) {
    if (openSession) {
      openSession.checkOut = endTime;
      openSession.duration = Math.max(
        0,
        Math.floor((endTime - checkInTime) / (1000 * 60)),
      );
      const totalMinutes = (log.sessions || []).reduce((sum, session) => {
        if (session.duration) return sum + session.duration;
        if (session.checkIn && session.checkOut) {
          return (
            sum +
            Math.max(
              0,
              Math.floor(
                (new Date(session.checkOut) - new Date(session.checkIn)) / (1000 * 60),
              ),
            )
          );
        }
        return sum;
      }, 0);
      log.duration = totalMinutes;
    } else {
      const duration = Math.floor((endTime - checkInTime) / (1000 * 60));
      log.duration = Math.max(duration, 0);
    }
    log.checkOut = endTime;
    return true;
  }

  return false;
};
