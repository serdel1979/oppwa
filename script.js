function generatePaymentLink() {
    fetch('/generate-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: '633.33',
            cardholderName: 'Test Testov' // Replace with actual user input
        })
    })
    .then(response => response.json())
    .then(data => {
        const linkElement = document.getElementById('payment-link');
        if (data.link) {
            linkElement.textContent = `Payment Link: ${data.link}`;
            linkElement.href = data.link; // Make it clickable
            linkElement.style.display = 'block';
        } else {
            linkElement.textContent = 'Error generating payment link.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('payment-link').textContent = 'Error generating payment link.';
    });
}

// Add event listener to the button
document.getElementById('generate-link').addEventListener('click', generatePaymentLink);
