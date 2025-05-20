let currentPageIndex = 1;
let pageSizeIndex = 10;

window.addEventListener('DOMContentLoaded', async function () {
    loadProvinces();

    const provinceSelect = document.getElementById('province-select');
    const subdistrictSelect = document.getElementById('subdistrict-select');
    const storeSelect = this.document.getElementById('store-select');
    const productSelect = this.document.getElementById('product-select');

    subdistrictSelect.disabled = true;
    storeSelect.disabled = true;
    productSelect.disabled = true;

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

    subdistrictSelect.addEventListener('change', function () {
        const subdistrictId = subdistrictSelect.value;
        if (subdistrictId) {
            storeSelect.disabled = false;
            loadStores(subdistrictId);
        } else {
            storeSelect.disabled = true;
            storeSelect.innerHTML = '<option value="">Tất cả Cửa Hàng</option>';
        }
    });

    storeSelect.addEventListener('change', function () {
        const storeId = storeSelect.value;
        if (storeId) {
            productSelect.disabled = false;
            loadProducts(storeId);
        } else {
            productSelect.disabled = true;
            productSelect.innerHTML = '<option value="">Tất cả Sản Phẩm</option>';
        }
    })

    searchStocks(currentPageIndex, pageSizeIndex);

});

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPage = 1;
    searchStocks(currentPageIndex, pageSizeIndex);
});

document.getElementById('exportReportBtn').addEventListener('click', function (event) {
    event.preventDefault();
    exportReport();
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

async function loadStores(subdistrictId) {
    const url = `${API_BASE_URL}Stores?pageNumber=1&pageSize=10000&subdistrictId=${subdistrictId}`;
    try {
        const response = await apiRequest(url, { method: 'GET' });
        const data = await response.json();
        const stores = data.items || [];

        const storeSelect = document.getElementById('store-select');
        storeSelect.innerHTML = '<option value="">-- Chọn cửa hàng --</option>';

        if (stores.length === 0) {
            storeSelect.disabled = true;
            return;
        }

        storeSelect.disabled = false;

        stores.forEach(subdistrict => {
            const option = document.createElement('option');
            option.value = subdistrict.id;
            option.textContent = subdistrict.name;
            storeSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error fetching stores:', error);
    }
}

async function loadProducts(storeId) {
    const url = `${API_BASE_URL}Stock/Product?PageNumber=1&PageSize=10000&storeId=${storeId}`;
    try {
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        const data = await response.json();
        const products = data.items || [];

        const productSelect = document.getElementById('product-select');
        productSelect.innerHTML = '<option value="">Tất cả Sản Phẩm</option>';

        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} <strong>${hours}:${minutes}</strong>`;
}

async function searchStocks(pageNumber = 1, pageSize = 10) {
    const provinceId = document.getElementById('province-select').value;
    const subdistrictId = document.getElementById('subdistrict-select').value;
    const storeId = document.getElementById('store-select').value;

    const productId = document.getElementById('product-select').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let url = `${API_BASE_URL}Stock/history/admin?PageNumber=${pageNumber}&PageSize=${pageSize}`;

    if (provinceId) url += `&provinceId=${provinceId}`;
    if (subdistrictId) url += `&subdistrictId=${subdistrictId}`;
    if (storeId) url += `&storeId=${storeId}`;
    if (productId) url += `&productId=${productId}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;

    try {
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.items)) {
                updateTable(data.items, pageNumber, data.totalPages || 1);
            } else {
                throw new Error('Dữ liệu trả về không đúng cấu trúc');
            }
        } else {
            throw new Error('Không thể lấy dữ liệu sản phẩm');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

function updateTable(stocks, pageNumber, totalPages) {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';

    if (Array.isArray(stocks) && stocks.length > 0) {
        stocks.forEach(stock => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${stock.storeName}</td>
                <td>${stock.productName}</td>
                <td>${stock.actionType}</td>
                <td>${stock.changedQuantity}</td>
                <td><strong>${stock.newQuantity}</strong></td>
                <td>${formatDate(stock.createdAt)}</td>
                <td>${stock.note}</td>
            `;

            tableBody.appendChild(row);
        });

        updatePaginationStock(pageNumber, totalPages);
    } else {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">Không có dữ liệu</td>`;
        tableBody.appendChild(noDataRow);
    }
}

function updatePaginationStock(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#stock-pagination .pagination');

    const firstPageButton = paginationContainer.querySelector('.first');
    const prevPageButton = paginationContainer.querySelector('.prev');
    const nextPageButton = paginationContainer.querySelector('.next');
    const lastPageButton = paginationContainer.querySelector('.last');

    firstPageButton.classList.toggle('disabled', currentPage === 1);
    prevPageButton.classList.toggle('disabled', currentPage === 1);
    nextPageButton.classList.toggle('disabled', currentPage === totalPages);
    lastPageButton.classList.toggle('disabled', currentPage === totalPages);

    const pageItems = paginationContainer.querySelectorAll('.page-item.page-number');
    pageItems.forEach(item => item.remove());

    firstPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage = 1;
            searchStocks(currentPage, pageSizeIndex);
        }
    });

    prevPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            searchStocks(currentPage, pageSizeIndex);
        }
    });

    nextPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            searchStocks(currentPage, pageSizeIndex);
        }
    });

    lastPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            searchStocks(currentPage, pageSizeIndex);
        }
    });

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item page-number${i === currentPage ? ' active' : ''}`;

        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = 'javascript:void(0);';
        pageLink.innerText = i;
        pageLink.addEventListener('click', () => {
            currentPage = i;
            searchStocks(currentPage, pageSizeIndex);
        });

        pageItem.appendChild(pageLink);
        paginationContainer.insertBefore(pageItem, nextPageButton);
    }
}

async function exportReport() {
    const provinceId = document.getElementById('province-select').value;
    const subdistrictId = document.getElementById('subdistrict-select').value;
    const storeId = document.getElementById('store-select').value;
    const productId = document.getElementById('product-select').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let url = `${API_BASE_URL}ExportReport/Stock_Report`;

    let params = [];

    if (provinceId) params.push(`provinceId=${provinceId}`);
    if (subdistrictId) params.push(`subdistrictId=${subdistrictId}`);
    if (storeId) params.push(`storeId=${storeId}`);
    if (productId) params.push(`productId=${productId}`);
    if (fromDate) params.push(`fromDate=${fromDate}`);
    if (toDate) params.push(`toDate=${toDate}`);

    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        if (!response.ok) {
            throw new Error('Không thể xuất file báo cáo');
        }

        const blob = await response.blob();

        const contentDisposition = response.headers.get('Content-Disposition');

        let filename = 'BaoCaoXuatNhapTon_' + getFormattedDateTime();

        if (contentDisposition) {
            const filenameStar = contentDisposition.split('filename*=UTF-8\'\'')[1];
            if (filenameStar) {
                filename = decodeURIComponent(filenameStar);
            } else {
                const filenamePart = contentDisposition.split('filename=')[1];
                if (filenamePart) {
                    filename = filenamePart.replace(/"/g, '');
                }
            }
        }

        const urlBlob = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlBlob);

    } catch (error) {
        console.error('Lỗi khi xuất báo cáo:', error);
    }
}

function getFormattedDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}_${hour}${minute}${second}`;
}