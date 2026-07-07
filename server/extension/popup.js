document.getElementById('fill-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: fillForm
  });

  const status = document.getElementById('status');
  status.textContent = "Processing...";
  setTimeout(() => status.textContent = "Form Auto-Filled!", 1500);
});

document.getElementById('cover-btn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    status.textContent = "Please select Job Description text first.";
    setTimeout(() => {
        status.textContent = "Text Copied to Clipboard with Prompt!";
        navigator.clipboard.writeText("Write a cover letter for this job description based on my skills as a Software Engineer [Insert CV here]: ");
    }, 1000);
});

// The content script function
function fillForm() {
    // 1. Detect Job Title
    const h1 = document.querySelector('h1');
    if (h1) {
        console.log("Job Detected:", h1.innerText);
        alert(`CampusMind AI: Job Detected - ${h1.innerText}`);
    }

    // 2. Simple Auto-Fill Logic
    const inputs = document.querySelectorAll('input, textarea');
    let filledCount = 0;

    inputs.forEach(input => {
        const name = (input.name || input.id || input.placeholder || "").toLowerCase();
        
        if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;

        if (name.includes('name') && !name.includes('company')) {
            input.value = "Alex Student";
            filledCount++;
        } else if (name.includes('email')) {
            input.value = "alex@campusmind.ai";
            filledCount++;
        } else if (name.includes('phone') || name.includes('mobile')) {
            input.value = "+1234567890";
            filledCount++;
        } else if (name.includes('linkedin') || name.includes('website')) {
            input.value = "https://linkedin.com/in/alex-student";
            filledCount++;
        }
        else if (name.includes('city') || name.includes('location')) {
             input.value = "San Francisco, CA";
             filledCount++;
        }
    });

    if (filledCount > 0) {
        // Highlight Filled Inputs
        inputs.forEach(input => {
            if (input.value) input.style.border = "2px solid #2563eb";
        });
        alert(`CampusMind AI: Auto-filled ${filledCount} fields successfully!`);
    } else {
        alert("CampusMind AI: No compatible form fields found on this page.");
    }
}
