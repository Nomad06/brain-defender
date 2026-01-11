document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.nav-item');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all contents
            contents.forEach(content => content.classList.remove('active'));

            // Show target content
            const targetId = tab.dataset.tab;
            document.getElementById(targetId).classList.add('active');
        });
    });
});
