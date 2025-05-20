let currentPageIndex = 1;
let pageSizeIndex = 10;

window.addEventListener('DOMContentLoaded', async function () {
    await getProfileData();
    searchOrders(currentPageIndex, pageSizeIndex);
showTestModal();

});

function showTestModal() {
    const myModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    myModal.show();
}


document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPageIndex = 1;
    searchOrders(currentPageIndex, pageSizeIndex);
});


async function searchOrders(pageNumber = 1, pageSize = 10) {
    if (!currentStoreId) {
        console.warn('Chưa có storeId, bỏ qua gọi API sản phẩm.');
        return;
    }

    const orderCode = document.getElementById('orderCode').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    // const customerEmail = document.getElementById('customerEmail').value.trim();
    const status = document.getElementById('status').value;
    const isPaidStr = document.getElementById('isPaid').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let url = `${API_BASE_URL}Order/history/store?storeId=${currentStoreId}&PageNumber=${pageNumber}&PageSize=${pageSize}`;

    if (orderCode) url += `&OrderCode=${encodeURIComponent(orderCode)}`;
    if (customerName) url += `&CustomerName=${encodeURIComponent(customerName)}`;
    if (customerPhone) url += `&CustomerPhone=${encodeURIComponent(customerPhone)}`;
    // if (customerEmail) url += `&CustomerEmail=${encodeURIComponent(customerEmail)}`;
    if (status) url += `&Status=${encodeURIComponent(status)}`;
    if (isPaidStr === 'true') {
        url += `&IsPaid=true`;
    } else if (isPaidStr === 'false') {
        url += `&IsPaid=false`;
    }
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

const statusClassMap = {
    Confirmed: 'btn-secondary',
    Completed: 'btn-success',
    Cancelled: 'btn-danger'
};

const nbsp = '\u00A0';

const statusVNMap = {
    Confirmed: 'ĐÃ XÁC NHẬN',
    Completed: 'HOÀN TẤT' + nbsp + nbsp + nbsp + nbsp + nbsp + nbsp + nbsp,
    Cancelled: 'ĐÃ HỦY ĐƠN' + nbsp + nbsp
};


function updateTable(orders, pageNumber, totalPages) {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';

    if (Array.isArray(orders) && orders.length > 0) {
        orders.forEach(order => {
            const btnGroupId = `statusDropdown-${order.orderCode}`;

            const statusClass = statusClassMap[order.status] || 'btn-primary';
            const statusText = statusVNMap[order.status] || 'Không rõ';

            const row = document.createElement('tr');

            row.dataset.id = order.orderCode;

            row.innerHTML = `
            <td>${order.orderCode}</td>
            <td>${order.customerName}</td>
            <td>${order.customerPhone}</td>
            <td>${order.totalAmount ? formatCurrency(order.totalAmount) : ''}</td>
            <td class="">
                <div class="btn-group" id="${btnGroupId}">
                    <button type="button" class="btn ${statusClass} btn-fixed-width">${statusText}</button>
                    <button
                        type="button"
                        class="btn ${statusClass} dropdown-toggle dropdown-toggle-split"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <span class="visually-hidden">Toggle Dropdown</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="javascript:void(0);" data-status="Confirmed">Xác nhận</a></li>
                        <li><a class="dropdown-item" href="javascript:void(0);" data-status="Completed">Hoàn thành</a></li>
                        <li><a class="dropdown-item" href="javascript:void(0);" data-status="Cancelled">Hủy đơn</a></li>
                    </ul>
                </div>
            </td>
            <td>${order.orderDate ? formatDate(order.orderDate) : ''}</td>
            <td><strong>${order.isPaid === true ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></td>
            <td>${order.paidAt ? formatDate(order.paidAt) : '___'}</td>
            <td>${order.note || ''}</td>
            `;

            row.addEventListener('click', function () {
                const selectedId = this.dataset.id;

                const modalElement = document.getElementById('searchStoreModal');
                const modal = bootstrap.Modal.getInstance(modalElement);
            });

            tableBody.appendChild(row);

            updateBtnGroupClass(order.status, btnGroupId);
        });

        updatePaginationOrder(pageNumber, totalPages);
    } else {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="13" class="text-center">Không có dữ liệu</td>`;
        tableBody.appendChild(noDataRow);
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

function formatCurrency(amount) {
    if (typeof amount !== 'number') return '';
    return amount.toLocaleString('vi-VN') + ' VNĐ';
}

function updatePaginationOrder(currentPage, totalPages) {
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
            searchOrders(currentPage, pageSizeIndex);
        }
    });

    prevPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            searchOrders(currentPage, pageSizeIndex);
        }
    });

    nextPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            searchOrders(currentPage, pageSizeIndex);
        }
    });

    lastPageButton.querySelector('a').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage = totalPages;
            searchOrders(currentPage, pageSizeIndex);
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
            searchOrders(currentPage, pageSizeIndex);
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

function updateBtnGroupClass(status, btnGroupId) {
    const statusClassMap = {
        Confirmed: 'btn-secondary',
        Completed: 'btn-success',
        Cancelled: 'btn-danger'
    };

    const btnGroup = document.getElementById(btnGroupId);
    if (!btnGroup) return;

    const newClass = statusClassMap[status] || 'btn-primary';

    const buttons = btnGroup.querySelectorAll('button');

    buttons.forEach(button => {
        button.classList.forEach(cls => {
            if (cls.startsWith('btn-')) {
                button.classList.remove(cls);
            }
        });
        button.classList.add(newClass);
    });
}
