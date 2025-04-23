function getStoredToken() {
    return localStorage.getItem('token');
}

function getStoredRefreshToken() {
    return localStorage.getItem('refreshToken');
}

function setTokens(token, refreshToken) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
}

async function refreshAccessToken() {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        alert('Bạn cần đăng nhập lại!');
        window.location.href = '../../index.html';
        throw new Error('Không có refresh token để làm mới');
    }

    const response = await fetch(`${API_BASE_URL}Auth/RefreshToken`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (data.token && data.refreshToken) {
        setTokens(data.token, data.refreshToken);
        return data.token;
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw new Error('Lỗi khi làm mới token');
    }
}

async function apiRequest(url, options = {}) {
    let token = getStoredToken();

    if (!token) {
        token = await refreshAccessToken(); 
    }

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, options);

    if (response.status === 402 && !skipRefresh) {
        token = await refreshAccessToken();
        options.headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, options); 
    }

    return response;
}
