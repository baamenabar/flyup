const fs = require('fs');
const path = require('path')
const fsPromises = require('fs').promises;
const mime = require('mime');

/**
 * Util function we will reuse to check if the caught error is simply a "not found" error
 *
 * @param {*} err
 * @returns {boolean}
 */
function isErrorNotFound(err) {
    return err.code === 'ENOENT';
}

/**
 * The good old synchronous check to see if a path results in a folder.
 *
 * @param {string} path
 * @returns {boolean}
 */
function isDirectory_sync(path) {
    try {
        const stat = fs.statSync(path);
        return stat.isDirectory();
    } catch (err) {
        // if it's simply a not found error
        if (isErrorNotFound(err)) {
            return false;
        }
        //othewise throw the error
        throw err;
    }
}

/**
 * Async + callback version of the check to see if a path resolves to a folder
 *
 * @param {string} path : does this resolve to a dir?
 * @param {Function} callback : this callback gets called with the result (bool)
 */
function isDirectory_callback(path, callback) {
    fs.stat(path, (err, stat) => {
        if (err) {
            const errorToReturn = isErrorNotFound(err) ? undefined : err;
            callback(errorToReturn, false);
            return;
        }
        callback(undefined, stat.isDirectory());
    });
}

/**
 * Promise based async check if a path resolves to a dir
 *
 * @param {string} path
 * @returns {Promise}
 */
function isDirectory_promise(path) {
    return fsPromises
        .stat(path)
        .then(fsStat => {
            return fsStat.isDirectory();
        })
        .catch(err => {
            if (isErrorNotFound(err)) {
                return false;
            }
            throw err;
        });
}

/**
 * Async awaited version of the check if a path resolves to a dir
 *
 * @param {string} path
 * @returns {Promise}
 */
async function isDirectory_asyncAwait(path) {
    // the result can be either false (from the caught error) or it can be an fs.stats object
    const result = await fsPromises.stat(path).catch(err => {
        if (isErrorNotFound(err)) {
            return false;
        }
        throw err;
    });

    return !result ? result : result.isDirectory();
}

/**
 * Mime related methods
 */

/**
 * Get mime and extension for the filetype of a path.
 *
 * @param {string} path
 * @returns {mimetype: string, extension: string}
 */
function getMimeTypeAndExtension(path) {
    let type = mime.getType(path);
    if (type === null) {
        // if not recognized and not a directory, we treat it as txt/plain
        // @todo: try to recognize with the file buffer.
        type = isDirectory_sync(path) ? 'DIRECTORY' : 'text/plain';
    }
    let extension = mime.getExtension(type);
    extension = extension === 'jpeg' ? 'jpg' : extension;
    return {
        mimetype: type,
        extension,
    };
}

/**
 * Returns an object with a bit more info than what stat does, including filename, size, extension and mimetype
 * @param {string} filePath
 */
function fileInfo(filePath) {
    const fileStat = fs.statSync(filePath);
    return {
        mtime: fileStat.mtime,
        name: path.basename(filePath),
        size: fileStat.size,
        ...getMimeTypeAndExtension(filePath),
    };
}

/**
 * For now we export only the sync and async await implementation
 */
module.exports = {
    isDirectory: isDirectory_asyncAwait,
    isDirectorySync: isDirectory_sync,
    getMimeTypeAndExtension,
    fileInfo,
};
