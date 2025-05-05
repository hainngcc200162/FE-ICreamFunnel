
async function getProfileData() {
    const url = `${API_BASE_URL}Auth/Profile`;  

    try {
        const response = await apiRequest(url, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();  
            return data;
        } else {
            throw new Error('Không thể lấy dữ liệu profile');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function displayProfileData() {
    const data = await getProfileData();
    if (data) {
        const profileName = data.name || 'Tên không có sẵn';
        const profileRole = data.role || 'Vai trò chưa xác định';
        const userInfoEl = document.getElementById('user-info');
        if (userInfoEl) {
            userInfoEl.innerHTML = `
                <span class="fw-semibold d-block">${profileName}</span>
                <small class="text-muted">${profileRole}</small>
            `;
        }
        const profileTitleEl = document.querySelector('.card-title.text-primary');
        if (profileTitleEl) {
            profileTitleEl.innerText = `Chào mừng ${profileName}! 🎉`;
        }        
    }
}

function logoutUser() {
    localStorage.clear();
    window.location.href = '../../index.html';
}

window.onload = function() {
    displayProfileData();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            logoutUser();
        });
    }
};
