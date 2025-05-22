let currentPage = 1;
let pageSize = 10;

document.addEventListener("DOMContentLoaded", function () {
    loadProvinces();
    searchStores(currentPage, pageSize);

    const addStoreBtn = document.getElementById("addStoreBtn");
    addStoreBtn.addEventListener("click", async function () {
        const addStoreModal = new bootstrap.Modal(document.getElementById("addStoreModal"));
        await loadProvincesToModal();
        addStoreModal.show();
    });

    const provinceSelect = document.getElementById('province-select');
    const subdistrictSelect = document.getElementById('subdistrict-select');

    subdistrictSelect.disabled = true;

    provinceSelect.addEventListener('change', function () {
        const provinceId = provinceSelect.value;
        if (provinceId) {
            subdistrictSelect.disabled = false;
            loadSubdistricts(provinceId);
        } else {
            subdistrictSelect.disabled = true;
            subdistrictSelect.innerHTML = '<option value="">Tất cả Quận - Huyện</option>';
        }
        
    });

    document.getElementById('addStoreButton').addEventListener('click', handleAddStore);

    addPaginationClickEvents();
});

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPage = 1;
    searchStores(currentPage, pageSize);
});

async function loadProvinces() {
    const url = `${API_BASE_URL}Provinces?pageNumber=1&pageSize=10000`;
    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const provinces = data.items || [];

        const provinceSelect = document.getElementById('province-select');
        provinceSelect.innerHTML = '<option value="">Tất Cả Tỉnh - Thành</option>';

        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching provinces:', error);
    }
}

async function loadSubdistricts(provinceId) {
    const url = `${API_BASE_URL}Subdistricts?pageNumber=1&pageSize=10000&provinceId=${provinceId}`;
    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const subdistricts = data.items || [];

        const subdistrictSelect = document.getElementById('subdistrict-select');
        subdistrictSelect.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';

        if (subdistricts.length === 0) {
            subdistrictSelect.disabled = true;
            return;
        }

        subdistrictSelect.disabled = false;

        subdistricts.forEach(subdistrict => {
            const option = document.createElement('option');
            option.value = subdistrict.id;
            option.textContent = subdistrict.name;
            subdistrictSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error fetching subdistricts:', error);
    }
}

function addPaginationClickEvents() {
    const pageLinks = document.querySelectorAll('.pagination .page-item .page-link');

    pageLinks.forEach(link => {
        link.addEventListener('click', function () {
            const selectedPage = parseInt(this.textContent);
            if (!isNaN(selectedPage)) {
                currentPage = selectedPage;
                searchStores(currentPage, pageSize);
            }
        });
    });
}

async function searchStores(pageNumber = 1, pageSize = 5) {
    const storeName = document.getElementById('byName').value.trim();
    const provinceId = document.getElementById('province-select').value;
    const subdistrictId = document.getElementById('subdistrict-select').value;
    const isStoreAssigned = document.getElementById('isStoreAssigned').value;

    let url = `${API_BASE_URL}Stores?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (storeName) url += `&storeName=${encodeURIComponent(storeName)}`;
    if (provinceId) url += `&provinceId=${provinceId}`;
    if (subdistrictId) url += `&subdistrictId=${subdistrictId}`;
    if (isStoreAssigned) url += `&isStoreAssigned=${isStoreAssigned}`;

    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const stores = data.items || [];

        const tbody = document.getElementById('store-results-body');
        tbody.innerHTML = '';

        if (stores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">Không tìm thấy cửa hàng nào.</td></tr>`;
            updatePagination(1, 1);
            return;
        }

        stores.forEach(store => {
            const row = document.createElement('tr');

            row.dataset.id = store.id;
            row.dataset.name = store.name;

            row.innerHTML = `
                <td><strong>${store.name}</strong></td>
                <td>${store.subdistrictName}</td>
                <td>${store.provinceName}</td>
                <td><strong>${store.isStoreAssigned ? 'Đã phân công' : 'Chưa phân công'}</strong></td>
                <td>
                    <a href="#" class="btn btn-icon text store-update-btn" data-store-id="${store.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="#" class="btn btn-icon text-danger store-delete-btn" data-store-id="${store.id}" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </td>
            `;

            tbody.appendChild(row);
        });
        attachUpdateEventListeners();
        attachDeleteEventListeners();

        updatePagination(pageNumber, data.totalPages || 1);

    } catch (error) {
        console.error('Lỗi khi tìm kiếm cửa hàng:', error);
    }
}

function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#store-pagination .pagination');

    const firstPageButton = paginationContainer.querySelector('.first');
    const prevPageButton = paginationContainer.querySelector('.prev');
    const nextPageButton = paginationContainer.querySelector('.next');
    const lastPageButton = paginationContainer.querySelector('.last');

    firstPageButton.classList.toggle('disabled', currentPage === 1);
    prevPageButton.classList.toggle('disabled', currentPage === 1);
    nextPageButton.classList.toggle('disabled', currentPage === totalPages);
    lastPageButton.classList.toggle('disabled', currentPage === totalPages);

    const pageItems = paginationContainer.querySelectorAll('.page-item.page-number, .page-item.ellipsis');
    pageItems.forEach(item => item.remove());

    firstPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchStores(1, pageSize);
    };
    prevPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchStores(currentPage - 1, pageSize);
    };
    nextPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchStores(currentPage + 1, pageSize);
    };
    lastPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchStores(totalPages, pageSize);
    };

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        addPageNumber(1);
        if (startPage > 2) addEllipsis();
    }

    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) addEllipsis();
        addPageNumber(totalPages);
    }

    function addPageNumber(page) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item page-number${page === currentPage ? ' active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = 'javascript:void(0);';
        pageLink.innerText = page;
        pageLink.addEventListener('click', () => {
            searchStores(page, pageSize);
        });

        pageItem.appendChild(pageLink);
        paginationContainer.insertBefore(pageItem, nextPageButton);
    }

    function addEllipsis() {
        const ellipsisItem = document.createElement('li');
        ellipsisItem.className = 'page-item ellipsis disabled';

        const ellipsisLink = document.createElement('span');
        ellipsisLink.className = 'page-link';
        ellipsisLink.innerText = '...';

        ellipsisItem.appendChild(ellipsisLink);
        paginationContainer.insertBefore(ellipsisItem, nextPageButton);
    }
}


function attachUpdateEventListeners() {
    const updateButtons = document.querySelectorAll(".store-update-btn");
    updateButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();
            const storeId = this.getAttribute('data-store-id');
            await updateStoreDetail(storeId);
        });
    });
}

async function updateStoreDetail(storeId) {
    localStorage.setItem('storeId', storeId);
    window.location.href = 'manage-store-update.html';
}

function attachDeleteEventListeners() {
    const deleteButtons = document.querySelectorAll(".store-delete-btn");
    deleteButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();
            const storeId = this.getAttribute('data-store-id');
            await deleteStore(storeId);
        });
    });
}

async function deleteStore(storeId) {
    const delStoreModal = new bootstrap.Modal(document.getElementById("delStoreModal"));
    delStoreModal.show();

    const deleteStoreBtn = document.getElementById('deleteStoreBtn');
    const storeNameInput = document.getElementById('store-name-del');
    const storeAddressInput = document.getElementById('store-address-del');
    const subdistrictNameInput = document.getElementById('subdistrict-name-del');
    const provinceNameInput = document.getElementById('province-name-del');
    const errorDivDel = document.getElementById('del-error-messages');
    const successDivDel = document.getElementById('del-error-success');

    try {
        const url = `${API_BASE_URL}Stores/${storeId}`;
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        if (response.ok) {
            const storeData = await response.json();
            storeNameInput.value = storeData.name ?? '';
            storeAddressInput.value = storeData.address ?? '';
            subdistrictNameInput.value = storeData.subdistrictName ?? '';
            provinceNameInput.value = storeData.provinceName ?? '';
        } else {
            throw new Error('Không thể lấy thông tin cửa hàng');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API chi tiết cửa hàng:', error);
        errorDivDel.textContent = 'Lỗi khi tải thông tin cửa hàng.';
        errorDivDel.classList.remove('d-none');
    }

    deleteStoreBtn.onclick = async function () {
        errorDivDel.classList.add('d-none');
        successDivDel.classList.add('d-none');
        errorDivDel.textContent = '';
        successDivDel.textContent = '';

        try {
            const deleteUrl = `${API_BASE_URL}Stores/${storeId}`;
            const deleteResponse = await apiRequest(deleteUrl, {
                method: 'DELETE',
                headers: { 'Accept': '*/*' }
            });

            if (deleteResponse.ok) {
                successDivDel.textContent = 'Xóa cửa hàng thành công!';
                successDivDel.classList.remove('d-none');
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('delStoreModal'));
                    modal.hide();
                    searchStores(currentPage, pageSize);
                }, 1000);
            } else {
                const errorText = await deleteResponse.text();
                throw new Error(errorText || 'Xóa thất bại!');
            }
        } catch (error) {
            errorDivDel.textContent = error.message || 'Đã có lỗi xảy ra!';
            errorDivDel.classList.remove('d-none');
        }
    };
}

async function loadProvincesToModal() {
    const url = `${API_BASE_URL}Provinces?pageNumber=1&pageSize=10000`;
    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const provinces = data.items || [];

        const provinceSelect = document.getElementById('province-select-store');
        const subdistrictSelect = document.getElementById('subdistrict-select-store');

        provinceSelect.innerHTML = '<option value="">Chọn tỉnh/thành phố</option>';
        subdistrictSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
        subdistrictSelect.disabled = true;

        provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });

        provinceSelect.addEventListener('change', async function () {
            const provinceId = this.value;
            subdistrictSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';

            if (!provinceId) {
                subdistrictSelect.disabled = true;
                return;
            }

            const subdistrictUrl = `${API_BASE_URL}Subdistricts?provinceId=${provinceId}&pageNumber=1&pageSize=10000`;
            try {
                const response = await apiRequest(subdistrictUrl, { method: 'GET' });
                const data = await response.json();
                const subdistricts = data.items || [];

                subdistricts.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub.id;
                    option.textContent = sub.name;
                    subdistrictSelect.appendChild(option);
                });

                subdistrictSelect.disabled = false;
            } catch (error) {
                console.error('Error loading subdistricts:', error);
                subdistrictSelect.disabled = true;
            }
        });

    } catch (error) {
        console.error('Error fetching provinces:', error);
    }
}

async function handleAddStore() {
    const name = document.getElementById('store-name-input').value.trim();
    const address = document.getElementById('store-address-input').value.trim();
    const provinceId = document.getElementById('province-select-store').value;
    const subdistrictId = document.getElementById('subdistrict-select-store').value;

    const errorDiv = document.getElementById('error-messages-store');
    const successDiv = document.getElementById('success-message-store');
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');

    if (!name || !address || !provinceId || !subdistrictId) {
        errorDiv.textContent = 'Vui lòng nhập đầy đủ thông tin.';
        errorDiv.classList.remove('d-none');
        return;
    }

    try {
        const response = await apiRequest(`${API_BASE_URL}Stores`, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, address, provinceId, subdistrictId }),
        });

        if (response.ok) {
            successDiv.textContent = 'Thêm cửa hàng thành công!';
            successDiv.classList.remove('d-none');

            // Reset form
            document.getElementById('store-name-input').value = '';
            document.getElementById('store-address-input').value = '';
            document.getElementById('province-select-store').value = '';
            document.getElementById('subdistrict-select-store').innerHTML = '<option value="">Chọn quận/huyện</option>';
            document.getElementById('subdistrict-select-store').disabled = true;

            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addStoreModal'));
                modal.hide();
                searchStores(currentPage, pageSize); 
            }, 1000);
        } else {
            const errorData = await response.json();
            errorDiv.textContent = errorData.message || 'Có lỗi xảy ra khi thêm.';
            errorDiv.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error adding store:', error);
        errorDiv.textContent = 'Có lỗi xảy ra.';
        errorDiv.classList.remove('d-none');
    }
}







