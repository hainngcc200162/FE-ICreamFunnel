let currentPage = 1;
let pageSize = 5;

document.addEventListener("DOMContentLoaded", function () {
    const searchStoreBtn = document.querySelector(".btn-outline-danger");
    const modalSearchBtn = document.getElementById("searchStoreBtn");

    searchStoreBtn.addEventListener("click", function () {
        const searchStoreModal = new bootstrap.Modal(document.getElementById("searchStoreModal"));
        searchStoreModal.show();
    });

    loadProvinces();

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
            subdistrictSelect.innerHTML = '<option value="">-- Tất cả --</option>';
        }
    });

    modalSearchBtn.addEventListener('click', function () {
        currentPage = 1;
        searchStores(currentPage, pageSize);
    });

    addPaginationClickEvents();
});

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

async function loadProvinces() {
    const url = `${API_BASE_URL}Provinces?pageNumber=1&pageSize=10000`;
    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const provinces = data.items || [];

        const provinceSelect = document.getElementById('province-select');
        provinceSelect.innerHTML = '<option value="">-- Tất cả --</option>';

        if (provinces.length === 0) {
            provinceSelect.innerHTML = '<option value="">-- Không có tỉnh/thành phố nào --</option>';
            return;
        }

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

async function searchStores(pageNumber = 1, pageSize = 5) {
    const storeName = document.getElementById('store-name-input').value.trim();
    const provinceId = document.getElementById('province-select').value;
    const subdistrictId = document.getElementById('subdistrict-select').value;
    
    let url = `${API_BASE_URL}Stores?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (storeName) url += `&storeName=${encodeURIComponent(storeName)}`;
    if (provinceId) url += `&provinceId=${provinceId}`;
    if (subdistrictId) url += `&subdistrictId=${subdistrictId}`;

    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const stores = data.items || [];

        const tbody = document.getElementById('store-results-body');
        tbody.innerHTML = '';

        if (stores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">Không tìm thấy cửa hàng nào.</td></tr>`;
            updatePagination(1, 1); 
            return;
        }

        stores.forEach(store => {
            const row = document.createElement('tr');
        
            row.dataset.id = store.id;
            row.dataset.name = store.name;
        
            row.innerHTML = `
                <td>${store.id}</td>
                <td>${store.name}</td>
                <td>${store.address}</td>
                <td>${store.subdistrictName}</td>
                <td><strong>${store.provinceName}</strong></td>
            `;
        
            row.addEventListener('click', function () {
                const selectedId = this.dataset.id;
                const selectedName = this.dataset.name;
                const storeNameBtn = document.getElementById('selected-store-name');
                if (storeNameBtn) {
                    storeNameBtn.innerHTML = selectedName;
                }
        
                const hiddenInput = document.getElementById('selected-store-id');
                if (hiddenInput) {
                    hiddenInput.value = selectedId;
                }
        
                const modalElement = document.getElementById('searchStoreModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
                modal.hide();
            });
        
            tbody.appendChild(row);
        });
        

        updatePagination(pageNumber, data.totalPages || 1); 
        console.log('Tổng số trang:', data.totalPages); 

    } catch (error) {
        console.error('Lỗi khi tìm kiếm cửa hàng:', error);
    }
}

function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#modal-pagination .pagination'); 

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
