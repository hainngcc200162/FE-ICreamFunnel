async function getProfileData() {
    const url = `${API_BASE_URL}Auth/Profile`;

    try {
        const response = await apiRequest(url, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();
            console.log('Dữ liệu profile:', data);
            return data;
        } else {
            throw new Error('Không thể lấy dữ liệu profile');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return null;
    }
}

function populateProfileForm(data) {
    if (!data) return;

    document.getElementById('fullName').value = data.name || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('phoneNumber').value = data.phoneNumber || '';
    document.getElementById('storeId').value = data.storeName || '';
    document.getElementById('storeAddress').value = data.storeAddress || '';
    document.getElementById('createdAt').value = data.createdAt
        ? new Date(data.createdAt).toISOString().slice(0, 16)
        : '';
    document.getElementById('role').value = data.role || '';
    document.getElementById('isActive').value = data.isActive ? 'Hoạt động' : 'Ngừng hoạt động';
}

window.onload = async function () {
    const profileData = await getProfileData();
    populateProfileForm(profileData);
};

function validatePhoneNumber(phoneNumber) {
    const regex = /^[0-9]{10,}$/;
    return regex.test(phoneNumber);
}

function validateFullName(name) {
    return name.split(' ').length > 1;
}

window.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.querySelector('#formAccountSettings button[type="submit"]');
    const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');
    const passwordInput = document.getElementById('modal-password-input');
    const modalEl = document.getElementById('passwordConfirmModal');
    const succesAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');

    const fullNameError = document.getElementById('fullName-error');
    const phoneNumberError = document.getElementById('phoneNumber-error');

    if (!modalEl) {
        console.error("Không tìm thấy phần tử modal có ID 'passwordConfirmModal'");
        return;
    }

    const passwordModal = new bootstrap.Modal(modalEl);
    let profileDataToUpdate = null;

    saveBtn.addEventListener('click', () => {
        const fullName = document.getElementById('fullName').value;
        const phoneNumber = document.getElementById('phoneNumber').value;

        fullNameError.classList.add('d-none');
        phoneNumberError.classList.add('d-none');

        let isValid = true;

        if (!validateFullName(fullName)) {
            fullNameError.textContent = 'Tên không hợp lệ.';
            fullNameError.classList.remove('d-none');
            isValid = false;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            phoneNumberError.textContent = 'Số điện thoại không hợp lệ.';
            phoneNumberError.classList.remove('d-none');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        profileDataToUpdate = {
            name: document.getElementById('fullName').value,
            phoneNumber: document.getElementById('phoneNumber').value
        };

        passwordInput.value = '';
        passwordModal.show();
    });

    confirmPasswordBtn.addEventListener('click', async () => {
        const password = passwordInput.value.trim();

        if (!password) {
            alert("Vui lòng nhập mật khẩu.");
            return;
        }

        try {
            const url = `${API_BASE_URL}Auth/UpdateProfile?password=${encodeURIComponent(password)}`;
            const response = await apiRequest(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileDataToUpdate)
            }, {
                skipRefresh: true
            });

            if (response.ok) {
                passwordModal.hide();
                succesAlert.textContent = 'Cập nhật thông tin thành công';
                succesAlert.style.display = 'block';
            } else {
                const errorData = await response.json();
                errorAlert.textContent = errorData.message;
                errorAlert.style.display = 'block';

            }
        } catch (error) {
            console.error('Lỗi:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin.');
        }
    });

    // Mở modal đổi mật khẩu khi nhấn nút trong form #formPasswordChange
    const passwordChangeForm = document.getElementById('formPasswordChange');
    const changePasswordModalEl = document.getElementById('changePasswordModal');
    const submitPasswordChangeBtn = document.getElementById('submitPasswordChange');
    const passwordChangeError = document.getElementById('changePasswordError');
    const passwordChangeSuccess = document.getElementById('changePasswordSuccess');

    if (passwordChangeForm && changePasswordModalEl && submitPasswordChangeBtn) {
        const changePasswordModal = new bootstrap.Modal(changePasswordModalEl);

        passwordChangeForm.addEventListener('submit', function () {
            // Reset thông báo lỗi/thành công và mở modal
            passwordChangeError.classList.add('d-none');
            passwordChangeSuccess.classList.add('d-none');
            document.getElementById('passwordChangeForm').reset();
            changePasswordModal.show();
        });

        submitPasswordChangeBtn.addEventListener('click', async () => {
            const oldPassword = document.getElementById('currentPassword').value.trim();
            const newPassword = document.getElementById('newPassword').value.trim();
            const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

            passwordChangeError.classList.add('d-none');
            passwordChangeSuccess.classList.add('d-none');

            if (!oldPassword || !newPassword || !confirmNewPassword) {
                passwordChangeError.textContent = 'Vui lòng điền đầy đủ thông tin.';
                passwordChangeError.classList.remove('d-none');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                passwordChangeError.textContent = 'Mật khẩu mới không trùng khớp.';
                passwordChangeError.classList.remove('d-none');
                return;
            }

            try {
                const url = `${API_BASE_URL}Auth/ChangePassword`;
                const response = await apiRequest(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        oldPassword,
                        newPassword,
                        confirmNewPassword
                    })
                });

                if (response.ok) {
                    passwordChangeSuccess.textContent = 'Đổi mật khẩu thành công.';
                    passwordChangeSuccess.classList.remove('d-none');
                    document.getElementById('passwordChangeForm').reset();
                } else {
                    const errorData = await response.json();
                    passwordChangeError.textContent = errorData.message || 'Đổi mật khẩu thất bại.';
                    passwordChangeError.classList.remove('d-none');
                }
            } catch (err) {
                console.error('Lỗi:', err);
                passwordChangeError.textContent = 'Không thể kết nối đến máy chủ.';
                passwordChangeError.classList.remove('d-none');
            }
        });
    }

});

