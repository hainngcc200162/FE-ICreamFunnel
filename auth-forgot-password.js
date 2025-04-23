document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formAuthentication');
    const emailInput = document.getElementById('email');
    const successAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Ẩn các thông báo cũ
        successAlert.style.display = 'none';
        errorAlert.style.display = 'none';

        const email = emailInput.value.trim();

        if (!email) {
            errorAlert.textContent = 'Vui lòng nhập email.';
            errorAlert.style.display = 'block';
            return;
        }

        try {
            const url = `${API_BASE_URL}Auth/ResetPassword`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': '*/*'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                successAlert.style.display = 'block';
            } else {
                const data = await response.json();
                errorAlert.textContent = data.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.';
                errorAlert.style.display = 'block';
            }
        } catch (err) {
            console.error('Lỗi gửi yêu cầu:', err);
            errorAlert.textContent = 'Không thể kết nối đến máy chủ.';
            errorAlert.style.display = 'block';
        }
    });
});