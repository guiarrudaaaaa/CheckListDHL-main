// Mocked storage service prepared for future migration to Firebase Storage.
// Currently not used by the app; functions are no-ops that return rejected
// promises if called to avoid accidental activation.
(function () {
    function uploadPhoto(/*fileOrDataUrl*/) {
        return Promise.reject(new Error('Storage service not activated. Migration pending.'));
    }

    function getPhotoUrl(/*pathOrId*/) {
        return Promise.reject(new Error('Storage service not activated.'));
    }

    window.services = window.services || {};
    window.services.storage = {
        uploadPhoto,
        getPhotoUrl
    };
})();
