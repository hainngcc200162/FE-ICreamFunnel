let currentPage = 1;
let pageSize = 5;

const successMessagesDiv = document.getElementById('scuccess-messages');
const errorMessagesDiv = document.getElementById('error-messages');

window.addEventListener('DOMContentLoaded', async function () {
    const provinceId = localStorage.getItem('provinceId');
    if (provinceId) {
        const url = `${API_BASE_URL}Provinces/${provinceId}`;

        try {
            const response = await apiRequest(url, {
                method: 'GET',
                headers: { 'Accept': '*/*' }
            });

            if (response.ok) {
                const provinceData = await response.json();

                document.getElementById('provinceId').value = provinceData.id ?? '';
                document.getElementById('provinceName').value = provinceData.name ?? '';

            } else {
                throw new Error('Không thể lấy thông tin chi tiết người dùng');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API chi tiết người dùng:', error);
        }
    } else {
        console.error('Không tìm thấy userId trong localStorage');
    }
    

    const updateProvinceBtn = document.getElementById('updateProvinceBtn');
    updateProvinceBtn.addEventListener('click', async function () {
        const id = document.getElementById('provinceId').value.trim();
        const provinceName = document.getElementById('provinceName').value.trim();

        const errorDiv = document.getElementById('error-messages');
        const successDiv = document.getElementById('error-success');

        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');
        errorDiv.textContent = '';
        successDiv.textContent = '';

        if (!provinceName) {
            showErrorMessage(errorDiv, 'Vui lòng nhập tên tỉnh/thành phố!');
            return;
        }

        await updateProvince(id,provinceName, errorDiv, successDiv);
    });
});

async function updateProvince(id, provinceName, errorDiv, successDiv) {
    const url = `${API_BASE_URL}Provinces/${id}?name=${encodeURIComponent(provinceName)}`;

    try {
        if (!provinceName || typeof provinceName !== 'string') {
            throw new Error('Tên tỉnh/thành phố không hợp lệ!');
        }

        const response = await apiRequest(url, {
            method: 'PUT', 
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();  
            successDiv.textContent = 'Cập nhật tỉnh/thành phố thành công!';
            successDiv.classList.remove('d-none');

        } else {
            const errorText = await response.text();  
            throw new Error(errorText || 'Cập nhật thất bại!');
        }
    } catch (error) {
        showErrorMessage(errorDiv, error.message || 'Đã có lỗi xảy ra!');
    }
}

function showErrorMessage(errorDiv, message) {
    errorDiv.textContent = message;
    const closeButton = document.createElement('button'); 
    closeButton.type = 'button';
    closeButton.classList.add('btn-close'); 
    closeButton.setAttribute('aria-label', 'Close'); 

    closeButton.addEventListener('click', function () {
        errorDiv.classList.add('d-none'); 
    });

    errorDiv.appendChild(closeButton);
    errorDiv.classList.remove('d-none'); 
}

function showSuccessMessage(successDiv, message) {
    successDiv.textContent = message; 
    const closeButton = document.createElement('button'); 
    closeButton.type = 'button';
    closeButton.classList.add('btn-close'); 
    closeButton.setAttribute('aria-label', 'Close'); 

    closeButton.addEventListener('click', function () {
        successDiv.classList.add('d-none'); 
    });

    successDiv.appendChild(closeButton);
    successDiv.classList.remove('d-none');
}

