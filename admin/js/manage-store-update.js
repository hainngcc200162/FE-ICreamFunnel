const successMessagesDiv = document.getElementById('error-success');
const errorMessagesDiv = document.getElementById('error-messages');

window.addEventListener('DOMContentLoaded', async function () {
    const storeId = localStorage.getItem('storeId'); 

    if (storeId) {
        const url = `${API_BASE_URL}Stores/${storeId}`;

        try {
            const response = await apiRequest(url, {
                method: 'GET',
                headers: { 'Accept': '*/*' }
            });

            if (response.ok) {
                const storeData = await response.json();

                document.getElementById('storeId').value = storeData.id ?? '';
                document.getElementById('storeName').value = storeData.name ?? '';
                document.getElementById('storeAddress').value = storeData.address ?? '';
                await renderProvinceOptions(storeData.provinceId); 
                await renderSubdistrictOptions(storeData.subdistrictId); 
            } else {
                showErrorMessage(errorMessagesDiv, 'Không thể lấy thông tin cửa hàng');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API chi tiết cửa hàng:', error);
        }
    } else {
        console.error('Không tìm thấy storeId trong localStorage');
    }

    const updateBtn = document.getElementById('updateStoreBtn');
    updateBtn.addEventListener('click', async function () {
        const id = document.getElementById('storeId').value.trim();
        const name = document.getElementById('storeName').value.trim();
        const address = document.getElementById('storeAddress').value.trim();
        const provinceId = document.getElementById('province-select-store-edit').value;
        const subdistrictId = document.getElementById('subdistrict-select-store-edit').value;

        errorMessagesDiv.classList.add('d-none');
        successMessagesDiv.classList.add('d-none');
        errorMessagesDiv.textContent = '';
        successMessagesDiv.textContent = '';

        if (!name || !address || !provinceId || !subdistrictId) {
            showErrorMessage(errorMessagesDiv, 'Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        await updateStore(id, name, address, provinceId, subdistrictId, errorMessagesDiv, successMessagesDiv);
    });
});

async function updateStore(id, name, address, provinceId, subdistrictId, errorDiv, successDiv) {
    const url = `${API_BASE_URL}Stores/${id}`;
    const body = JSON.stringify({
        name,
        address,
        provinceId: parseInt(provinceId),
        subdistrictId: parseInt(subdistrictId)
    });

    try {
        const response = await apiRequest(url, {
            method: 'PUT',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            },
            body: body
        });

        if (response.ok) {
            showSuccessMessage(successDiv, 'Cập nhật cửa hàng thành công!');
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

async function renderProvinceOptions(selectedProvinceId = null) {
    const select = document.getElementById('province-select-store-edit');
    select.innerHTML = `<option value="">-- Chọn tỉnh/thành --</option>`;

    try {
        const url = `${API_BASE_URL}Provinces`;
        const response = await apiRequest(url, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();
            const provinces = Array.isArray(data) ? data : data.items ?? [];

            provinces.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.name;
                if (selectedProvinceId && parseInt(p.id) === parseInt(selectedProvinceId)) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách tỉnh:', error);
    }
}

async function renderSubdistrictOptions(selectedSubdistrictId = null) {
    const select = document.getElementById('subdistrict-select-store-edit');
    select.innerHTML = `<option value="">-- Chọn quận/huyện --</option>`;

    try {
        const url = `${API_BASE_URL}Subdistricts`;
        const response = await apiRequest(url, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();
            const subdistricts = Array.isArray(data) ? data : data.items ?? [];

            subdistricts.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.name;
                if (selectedSubdistrictId && parseInt(s.id) === parseInt(selectedSubdistrictId)) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách quận/huyện:', error);
    }
}
