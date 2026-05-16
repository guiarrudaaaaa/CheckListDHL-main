// Lightweight wrapper to expose Firebase operations as a service
// This file intentionally delegates to the global firebase helpers
// initialized by `firebase-init.js` to avoid changing runtime behavior.
(function () {
    function ensure() {
        if (!window.firebaseDb) throw new Error('Firebase not initialized');
    }

    function addChecklist(doc) {
        ensure();
        return window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, 'checklists'), doc);
    }

    function getChecklistsQuery(q) {
        ensure();
        return window.firebaseGetDocs(q);
    }

    function updateChecklist(docRef, updates) {
        ensure();
        return window.firebaseUpdateDoc(docRef, updates);
    }

    function deleteChecklistDoc(docRef) {
        ensure();
        return window.firebaseDeleteDoc(docRef);
    }

    window.services = window.services || {};
    window.services.firebase = {
        addChecklist,
        getChecklistsQuery,
        updateChecklist,
        deleteChecklistDoc
    };
})();
