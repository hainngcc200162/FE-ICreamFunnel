const successMessagesDiv = document.getElementById('success-messages');
const errorMessagesDiv = document.getElementById('error-messages');

window.addEventListener('DOMContentLoaded', async function () {
    const subdistrictId = localStorage.getItem('subdistrictId');

    if (subdistrictId) {
        const url = `${API_BASE_URL}Subdistricts/${subdistrictId}`;

        try {
            const response = await apiRequest(url, {
                method: 'GET',
                headers: { 'Accept': '*/*' }
            });

            if (response.ok) {
                const subdistrictData = await response.json();

                document.getElementById('subdistrictId').value = subdistrictData.id ?? '';
                document.getElementById('subdistrictName').value = subdistrictData.name ?? '';
                await renderProvinceOptions(subdistrictData.provinceId); // load danh sách tỉnh và set selected

            } else {
                throw new Error('Không thể lấy thông tin chi tiết quận/huyện');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API chi tiết subdistrict:', error);
        }
    } else {
        console.error('Không tìm thấy subdistrictId trong localStorage');
    }

    const updateBtn = document.getElementById('updateSubdistrictBtn');
    updateBtn.addEventListener('click', async function () {
        const id = document.getElementById('subdistrictId').value.trim();
        const name = document.getElementById('subdistrictName').value.trim();
        const provinceId = document.getElementById('province-select-update').value;

        const errorDiv = document.getElementById('error-messages');
        const successDiv = document.getElementById('error-success');

        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');
        errorDiv.textContent = '';
        successDiv.textContent = '';

        if (!name || !provinceId) {
            showErrorMessage(errorDiv, 'Vui lòng nhập đầy đủ thông tin!');
            return;
        }

        await updateSubdistrict(id, name, provinceId, errorDiv, successDiv);
    });
});

async function updateSubdistrict(id, name, provinceId, errorDiv, successDiv) {
    const url = `${API_BASE_URL}Subdistricts/${id}`;
    const body = JSON.stringify({ name, provinceId: parseInt(provinceId) });

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
            showSuccessMessage(successDiv, 'Cập nhật quận/huyện thành công!');
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
    const select = document.getElementById('province-select-update');
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
