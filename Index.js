document.getElementById('formAuthentication').addEventListener('submit', function (event) {
  event.preventDefault();

  const errorFields = ['email', 'password'];
  errorFields.forEach(field => {
    const errorEl = document.getElementById(`${field}-error`);
    if (errorEl) {
      errorEl.classList.add('d-none');
      errorEl.innerText = '';
    }
  });

  const errorMessagesDiv = document.getElementById('error-messages');
  errorMessagesDiv.classList.add('d-none');
  errorMessagesDiv.innerText = '';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let hasError = false;

  if (!email) {
    showError('email', 'Email không được để trống.');
    hasError = true;
  } else if (!emailRegex.test(email)) {
    showError('email', 'Email không đúng định dạng.');
    hasError = true;
  }

  if (!password) {
    showError('password', 'Mật khẩu không được để trống.');
    hasError = true;
  }

  if (hasError) return;

  const data = {
    email: email,
    password: password,
    isActive: true
  };

  fetch(`${API_BASE_URL}Auth/Login`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(data => {
      if (data.token && data.refreshToken) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        getProfileData().then(() => {
          window.location.href = '/admin/page/dashboard.html';
        });
      } else {
        errorMessagesDiv.innerText = 'Thông tin đăng nhập không đúng. Vui lòng kiểm tra lại.';
        errorMessagesDiv.classList.remove('d-none');
      }
    })
    .catch(error => {
      console.error('Có lỗi xảy ra:', error);
      errorMessagesDiv.innerText = 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.';
      errorMessagesDiv.classList.remove('d-none');
    });

  function showError(fieldId, message) {
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.innerText = message;
      errorEl.classList.remove('d-none');
    }
  }

  async function getProfileData() {
    const url = `${API_BASE_URL}Auth/Profile`;
  
    try {
        const response = await apiRequest(url, { method: 'GET' });
  
        if (response.ok) {
            const data = await response.json();
            userRole = data.role; 
            localStorage.setItem('userRole', userRole);

            console.log(userRole);
            
            return data;
        } else {
            throw new Error('Không thể lấy dữ liệu profile');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
  
  }
});
