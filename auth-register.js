document.getElementById('formAuthentication').addEventListener('submit', function (event) {
    event.preventDefault();

    // Clear lỗi trước đó
    const fields = ['username', 'email', 'phonenumber', 'password', 'confirm-password', 'terms'];
    fields.forEach(field => {
        const errorEl = document.getElementById(`${field}-error`);
        if (errorEl) {
            errorEl.classList.add('d-none');
            errorEl.innerText = '';
        }
    });

    const errorMessagesDiv = document.getElementById('error-messages');
    errorMessagesDiv.classList.add('d-none');
    errorMessagesDiv.innerText = '';

    // Lấy giá trị
    const fullname = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phonenumber').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    const termsAccepted = document.getElementById('terms-conditions').checked;

    // Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{9,11}$/;

    let hasError = false;

    if (!fullname) {
        showError('username', 'Họ và tên không được để trống.');
        hasError = true;
    }

    if (!email) {
        showError('email', 'Email không được để trống.');
        hasError = true;
    } else if (!emailRegex.test(email)) {
        showError('email', 'Email không đúng định dạng.');
        hasError = true;
    }

    if (!phone) {
        showError('phonenumber', 'Số điện thoại không được để trống.');
        hasError = true;
    } else if (!phoneRegex.test(phone)) {
        showError('phonenumber', 'Số điện thoại không hợp lệ (9–11 chữ số).');
        hasError = true;
    }

    if (!password) {
        showError('password', 'Mật khẩu không được để trống.');
        hasError = true;
    } else if (password.length < 6) {
        showError('password', 'Mật khẩu phải có ít nhất 6 ký tự.');
        hasError = true;
    }

    if (!confirmPassword) {
        showError('confirm-password', 'Vui lòng xác nhận lại mật khẩu.');
        hasError = true;
    } else if (confirmPassword !== password) {
        showError('confirm-password', 'Mật khẩu xác nhận chưa khớp.');
        hasError = true;
    }

    if (!termsAccepted) {
        showError('terms', 'Bạn cần đồng ý với điều khoản.');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    // Tạo object gửi đi
    const data = {
        fullname: fullname,
        email: email,
        phoneNumber: phone,
        password: password
    };

    fetch(`${API_BASE_URL}Auth/Register`, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Đăng ký thành công!');
            } else if (data.errors) {
                for (const field in data.errors) {
                    showError(field, data.errors[field]);
                }
            } else {
                errorMessagesDiv.innerText = data.message || 'Cảnh báo: ' + data;
                errorMessagesDiv.classList.remove('d-none');
            }
            
        })
        .catch(error => {
            console.error('Lỗi kết nối:', error);
            errorMessagesDiv.innerText = 'Không thể kết nối đến server.';
            errorMessagesDiv.classList.remove('d-none');
        });

    // Hàm hiển thị lỗi dưới input
    function showError(fieldId, message) {
        const errorEl = document.getElementById(`${fieldId}-error`);
        if (errorEl) {
            errorEl.innerText = message;
            errorEl.classList.remove('d-none');
        }
    }
});
