let currentPageIndex = 1;
let pageSizeIndex = 10;

window.addEventListener('DOMContentLoaded', async function () {
    await getProfileData();
    await loadProducts();
    searchStocks(currentPageIndex, pageSizeIndex);
});

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPage = 1;
    searchStocks(currentPageIndex, pageSizeIndex);
});

async function loadProducts(pageNumber = 1, pageSize = 5) {
    if (!currentStoreId) {
        console.warn('Chưa có storeId, bỏ qua gọi API sản phẩm.');
        return;
    }

    const url = `${API_BASE_URL}Stock/Product?PageNumber=${pageNumber}&PageSize=${pageSize}&storeId=${currentStoreId}`;

    try {
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        const data = await response.json();
        const products = data.items || [];

        const productSelect = document.getElementById('product-select');
        productSelect.innerHTML = '<option value="">Tất cả sản phẩm</option>';

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
    if (!currentStoreId) {
        console.warn('Chưa có storeId, bỏ qua gọi API sản phẩm.');
        return;
    }

    const productId = document.getElementById('product-select').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let url = `${API_BASE_URL}Stock/history/store?storeId=${currentStoreId}&PageNumber=${pageNumber}&PageSize=${pageSize}`;
    
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

async function getProfileData() {
    const url = `${API_BASE_URL}Auth/Profile`;
    try {
        const response = await apiRequest(url, { method: 'GET' });

        if (response.ok) {
            const data = await response.json();
            currentStoreId = data.storeId;

            const storeIdInput = document.getElementById('storeId');
            if (storeIdInput) {
                storeIdInput.value = data.storeId ?? '';
            }

            const storeNameInput = document.getElementById('storeName');
            if (storeNameInput && storeNameInput.tagName === 'INPUT') {
                storeNameInput.value = data.storeName ?? '';
            }

            const storeNameHeader = document.getElementById('storeName');
            if (storeNameHeader && storeNameHeader.tagName === 'H5') {
                storeNameHeader.textContent = data.storeName ?? 'Tên cửa hàng không xác định';
            }

            return data;
        } else {
            throw new Error('Không thể lấy dữ liệu profile');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}
