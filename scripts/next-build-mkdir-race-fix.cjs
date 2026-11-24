const fs = require("node:fs");

if (process.platform === "win32") {
  const originalMkdir = fs.mkdir;
  const originalStat = fs.stat;
  const retryableErrors = new Set(["EPERM", "EEXIST", "ENOENT"]);
  const retryDelayMs = 10;
  const retryCount = 6;

  function finishDirectoryRace(path, error, callback, attempt = 0) {
    originalStat.call(fs, path, (statError, stats) => {
      if (!statError && stats.isDirectory()) {
        callback(null);
        return;
      }

      if (attempt < retryCount) {
        setTimeout(
          () => finishDirectoryRace(path, error, callback, attempt + 1),
          retryDelayMs
        );
        return;
      }

      callback(error);
    });
  }

  fs.mkdir = function mkdirWithWindowsRaceRecovery(path, options, callback) {
    const callbackFunction =
      typeof options === "function" ? options : callback;
    const mkdirOptions =
      typeof options === "function" ? undefined : options;

    let attempt = 0;
    const tryMkdir = () => {
      originalMkdir.call(this, path, mkdirOptions, (error, ...result) => {
        if (!error || !retryableErrors.has(error.code)) {
          callbackFunction?.(error, ...result);
          return;
        }

        finishDirectoryRace(path, error, (raceError) => {
          if (!raceError) {
            callbackFunction?.(null, ...result);
            return;
          }

          if (attempt < retryCount) {
            attempt += 1;
            setTimeout(tryMkdir, retryDelayMs);
            return;
          }

          callbackFunction?.(raceError, ...result);
        });
      });
    };

    return tryMkdir();
  };

  const originalPromiseMkdir = fs.promises.mkdir.bind(fs.promises);
  const originalPromiseStat = fs.promises.stat.bind(fs.promises);

  fs.promises.mkdir = async function mkdirWithWindowsRaceRecovery(
    path,
    options
  ) {
    try {
      return await originalPromiseMkdir(path, options);
    } catch (error) {
      if (!retryableErrors.has(error.code)) throw error;

      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        try {
          const stats = await originalPromiseStat(path);
          if (stats.isDirectory()) return undefined;
        } catch {
          // The competing worker may not have created the folder yet.
        }

        if (attempt < retryCount) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          try {
            return await originalPromiseMkdir(path, options);
          } catch (retryError) {
            if (!retryableErrors.has(retryError.code)) throw retryError;
          }
        }
      }

      throw error;
    }
  };
}
