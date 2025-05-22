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

document.getElementById('exportReportBtn').addEventListener('click', function (event) {
    event.preventDefault();
    exportReport();
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

async function exportReport() {
    if (!currentStoreId) {
        console.warn('Chưa có storeId, bỏ qua gọi API sản phẩm.');
        return;
    }

    const productId = document.getElementById('product-select').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let url = `${API_BASE_URL}ExportReport/Stock_Report?storeId=${currentStoreId}`;

    if (productId) url += `&productId=${productId}`;
    if (fromDate) url += `&fromDate=${fromDate}`;
    if (toDate) url += `&toDate=${toDate}`;

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

        // Tạo URL và tự động tải file
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

// function updatePaginationStock(currentPage, totalPages) {
//     const paginationContainer = document.querySelector('#stock-pagination .pagination');

//     const firstPageButton = paginationContainer.querySelector('.first');
//     const prevPageButton = paginationContainer.querySelector('.prev');
//     const nextPageButton = paginationContainer.querySelector('.next');
//     const lastPageButton = paginationContainer.querySelector('.last');

//     firstPageButton.classList.toggle('disabled', currentPage === 1);
//     prevPageButton.classList.toggle('disabled', currentPage === 1);
//     nextPageButton.classList.toggle('disabled', currentPage === totalPages);
//     lastPageButton.classList.toggle('disabled', currentPage === totalPages);

//     const pageItems = paginationContainer.querySelectorAll('.page-item.page-number');
//     pageItems.forEach(item => item.remove());

//     firstPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage > 1) {
//             currentPage = 1;
//             searchStocks(currentPage, pageSizeIndex);
//         }
//     });

//     prevPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage > 1) {
//             currentPage--;
//             searchStocks(currentPage, pageSizeIndex);
//         }
//     });

//     nextPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage < totalPages) {
//             currentPage++;
//             searchStocks(currentPage, pageSizeIndex);
//         }
//     });

//     lastPageButton.querySelector('a').addEventListener('click', () => {
//         if (currentPage < totalPages) {
//             currentPage = totalPages;
//             searchStocks(currentPage, pageSizeIndex);
//         }
//     });

//     for (let i = 1; i <= totalPages; i++) {
//         const pageItem = document.createElement('li');
//         pageItem.className = `page-item page-number${i === currentPage ? ' active' : ''}`;

//         const pageLink = document.createElement('a');
//         pageLink.className = 'page-link';
//         pageLink.href = 'javascript:void(0);';
//         pageLink.innerText = i;
//         pageLink.addEventListener('click', () => {
//             currentPage = i;
//             searchStocks(currentPage, pageSizeIndex);
//         });

//         pageItem.appendChild(pageLink);
//         paginationContainer.insertBefore(pageItem, nextPageButton);
//     }
// }

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

    const pageItems = paginationContainer.querySelectorAll('.page-item.page-number, .page-item.ellipsis');
    pageItems.forEach(item => item.remove());

    firstPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchStocks(1, pageSizeIndex);
    };
    prevPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchStocks(currentPage - 1, pageSizeIndex);
    };
    nextPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchStocks(currentPage + 1, pageSizeIndex);
    };
    lastPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchStocks(totalPages, pageSizeIndex);
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
            searchStocks(page, pageSizeIndex);
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
