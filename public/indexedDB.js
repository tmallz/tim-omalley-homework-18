const request = window.indexedDB.open("Budget", 1);
let db;

request.onupgradeneeded = function(event){
    const db = request.result;
    db.createObjectStore("pending", {autoIncrement: true});
}

request.onsuccess = function(event){
    db = request.result;
    db.onerror = function(){
        console.log('Error occured')
    }
    checkDatabase(db);
}

function checkDatabase(db){
    const transaction = db.transaction(['pending'], "readwrite");
    const store = transaction.objectStore("pending");
    const allRecords = store.getAll();

    allRecords.onsuccess = function () {
        if(allRecords.result.length > 0){
            fetch("api/transaction/bulk", {
                method: 'POST',
                body: JSON.stringify(allRecords.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(res => {return res.json()})
            .then(() => {
                const transaction = db.transaction(['pending'], "readwrite");
                const store = transaction.objectStore("pending");
                store.clear();
            })
        }
    }
}

function saveRecord(record) {
    const db = request.result;
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}