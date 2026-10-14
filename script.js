async function getRate() {
    let item = document.getElementById("item").value;

    let res = await fetch(`http://localhost:3000/rate/${item}`);
    let data = await res.json();

    if (data[item] && data[item].inr) {
        document.getElementById("result").innerText =
            `₹ ${data[item].inr}`;
    } else {
        document.getElementById("result").innerText =
            "Data not found";
    }
}