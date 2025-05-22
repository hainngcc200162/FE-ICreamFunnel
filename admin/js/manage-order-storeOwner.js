let currentPageIndex = 1;
let pageSizeIndex = 10;
const successMessagesDiv = document.getElementById('error-success');
const errorMessagesDiv = document.getElementById('error-messages');


window.addEventListener('DOMContentLoaded', async function () {
    await getProfileData();
    searchOrders(currentPageIndex, pageSizeIndex);
    showStatusMessageIfAny();
});

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
    const status = document.getElementById('status').value;
    const isPaidStr = document.getElementById('isPaid').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let url = `${API_BASE_URL}Order/history/store?storeId=${currentStoreId}&PageNumber=${pageNumber}&PageSize=${pageSize}`;

    if (orderCode) url += `&OrderCode=${encodeURIComponent(orderCode)}`;
    if (customerName) url += `&CustomerName=${encodeURIComponent(customerName)}`;
    if (customerPhone) url += `&CustomerPhone=${encodeURIComponent(customerPhone)}`;
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
    Processing: 'btn-warning',
    Completed: 'btn-success',
    Cancelled: 'btn-danger'
};

const nbsp = '\u00A0';

const statusVNMap = {
    Confirmed: 'ĐÃ XÁC NHẬN',
    Processing: 'ĐANG XỬ LÝ' + nbsp + nbsp + nbsp + nbsp,
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

            row.dataset.orderCode = order.orderCode;
            row.dataset.id = order.id;

            let dropdownOptions = '';
            let isDropdownDisabled = false;

            if (order.status === 'Confirmed') {
                dropdownOptions += `
                <li><a class="dropdown-item" href="javascript:void(0);" data-status="Processing">Xử lý đơn hàng</a></li>
                <li><a class="dropdown-item" href="javascript:void(0);" data-status="Completed">Hoàn thành</a></li>
                <li><a class="dropdown-item" href="javascript:void(0);" data-status="Cancelled">Hủy đơn</a></li>
            `;
            } else if (order.status === 'Processing') {
                dropdownOptions += `
                <li><a class="dropdown-item" href="javascript:void(0);" data-status="Completed">Hoàn thành</a></li>
                <li><a class="dropdown-item" href="javascript:void(0);" data-status="Cancelled">Hủy đơn</a></li>
            `;
            } else {
                isDropdownDisabled = true;
            }

            row.innerHTML = `
                <td>${order.orderCode}</td>
                <td>${order.customerName}</td>
                <td>${order.customerPhone}</td>
                <td>${formatDate(order.orderDate)}</td>
                <td><strong>${order.isPaid === true ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></td>
                <td>
                    <div class="btn-group" id="${btnGroupId}">
                        <button type="button" class="btn ${statusClass} btn-fixed-width">${statusText}</button>
                        <button
                            type="button"
                            class="btn ${statusClass} dropdown-toggle dropdown-toggle-split"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            ${isDropdownDisabled ? 'disabled' : ''}
                        >
                            <span class="visually-hidden">Toggle Dropdown</span>
                        </button>
                        <ul class="dropdown-menu">
                            ${dropdownOptions}
                        </ul>
                    </div>
                </td>
            `;

            attachRowClickHandler(row);
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

function attachRowClickHandler(row) {
    row.addEventListener('click', async function () {
        const selectedOrderCode = this.dataset.orderCode;

        try {
            const apiUrl = `${API_BASE_URL}Order/order-code/${selectedOrderCode}`;
            const response = await apiRequest(apiUrl, { method: 'GET' });

            if (response.ok) {
                const orderData = await response.json();
                fillOrderModal(orderData);

                const modalElement = document.getElementById('orderDetailModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
                    modal.show();
                }
            } else {
                console.error('Không thể lấy chi tiết đơn hàng');
            }
        } catch (err) {
            console.error('Lỗi khi gọi API đơn hàng:', err);
        }
    });

    const btnGroups = row.querySelectorAll('.btn-group, .dropdown-menu, .dropdown-item, .btn');
    btnGroups.forEach(el => {
        el.addEventListener('click', async function (e) {
            e.stopPropagation();

            if (el.classList.contains('dropdown-item')) {
                const newStatus = el.dataset.status;
                const orderCode = row.dataset.orderCode;

                try {
                    const success = await updateOrderStatus(orderCode, newStatus);

                    if (success) {
                        const statusCell = row.querySelector('.status-cell');
                        if (statusCell) statusCell.textContent = newStatus;

                        showSuccessMessage(successMessagesDiv, `Cập nhật trạng thái đơn ${orderCode} thành công!`);
                        window.scrollTo(0, 0);
                        
                    } else {
                        showErrorMessage(errorMessagesDiv, 'Cập nhật trạng thái thất bại, vui lòng thử lại.');
                        window.scrollTo(0, 0);
                    }
                } catch (err) {
                    showErrorMessage(errorMessagesDiv, 'Lỗi khi cập nhật trạng thái: ' + err.message);
                }
            }
        });
    });
}

function setStatusMessage(type, message) {
    localStorage.setItem('order-status-message', JSON.stringify({ type, message }));
}

function showStatusMessageIfAny() {
    const messageData = JSON.parse(localStorage.getItem('order-status-message'));
    if (!messageData) return;

    const successBox = document.getElementById('error-success');
    const errorBox = document.getElementById('error-messages');

    if (messageData.type === 'success') {
        showSuccessMessage(successBox, messageData.message);
    } else {
        showErrorMessage(errorBox, messageData.message);
    }

    localStorage.removeItem('order-status-message');
}


function showErrorMessage(errorDiv, message) {
    errorDiv.innerHTML = '';
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
    successDiv.innerHTML = '';
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


const orderStatusEnum = {
    Confirmed: 0,
    Processing: 1,
    Completed: 2,
    Cancelled: 3
};

async function updateOrderStatus(orderCode, newStatusString) {
    const newStatus = orderStatusEnum[newStatusString];

    errorMessagesDiv.classList.add('d-none');
    successMessagesDiv.classList.add('d-none');
    errorMessagesDiv.textContent = '';
    successMessagesDiv.textContent = '';

    if (newStatus === undefined) {
        console.error('Trạng thái không hợp lệ:', newStatusString);
        return false;
    }

    const url = `${API_BASE_URL}Order/update-status/${orderCode}`;

    try {
        const response = await apiRequest(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newStatus)
        });

        if (!response.ok) {
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        return true;
    } catch (error) {
        console.error('Lỗi khi gọi API cập nhật trạng thái:', error);
        return false;
    }
}

const statusVNMapModal = {
    Confirmed: 'ĐÃ XÁC NHẬN',
    Processing: 'ĐANG XỬ LÝ',
    Completed: 'ĐÃ HOÀN THÀNH',
    Cancelled: 'ĐÃ HỦY'
};

function fillOrderModal(data) {
    document.getElementById('orderCodeModal').textContent = data.orderCode || '—';
    document.getElementById('verificationCodeModal').textContent = data.verificationCode || '—';
    document.getElementById('orderDateModal').textContent = new Date(data.orderDate).toLocaleString('vi-VN') || '—';
    document.getElementById('customerNameModal').textContent = data.customerName || '—';
    document.getElementById('customerPhoneModal').textContent = data.customerPhone || '—';
    document.getElementById('customerEmailModal').textContent = data.customerEmail || '—';
    document.getElementById('noteModal').textContent = data.note || '—';
    document.getElementById('isPaidModal').textContent = data.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán';
    document.getElementById('paymentDateModal').textContent = new Date(data.paidAt).toLocaleString('vi-VN') || '—';

    const statusEl = document.getElementById('statusModal');
    const status = data.status || '—';

    statusEl.textContent = statusVNMapModal[status] || status;

    statusEl.className = '';

    if (status === 'Completed') {
        statusEl.classList.add('text-success', 'fw-bold');
    } else if (status === 'Cancelled') {
        statusEl.classList.add('text-danger', 'fw-bold');
    } else if (status === 'Confirmed') {
        statusEl.classList.add('fw-bold');
    } else {
        statusEl.classList.add('text-muted');
    }

    const tbody = document.getElementById("orderDetailsBodyModal");
    tbody.innerHTML = '';

    data.orderDetails.forEach(item => {
        const row = document.createElement('tr');

        row.innerHTML = `
                    <td>${item.productName}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-center">${formatCurrency(item.price)}</td>
                    <td class="text-center">${formatCurrency(item.price * item.quantity)}</td>
            `;

        tbody.appendChild(row);
    });

    const totalCell = document.getElementById("totalAmountCellModal");
    totalCell.textContent = formatCurrency(data.totalAmount);
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
    const paginationContainer = document.querySelector('#order-pagination .pagination');

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
        if (currentPage > 1) searchOrders(1, pageSizeIndex);
    };
    prevPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchOrders(currentPage - 1, pageSizeIndex);
    };
    nextPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchOrders(currentPage + 1, pageSizeIndex);
    };
    lastPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchOrders(totalPages, pageSizeIndex);
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
            searchOrders(page, pageSizeIndex);
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

function updateBtnGroupClass(status, btnGroupId) {
    const statusClassMap = {
        Confirmed: 'btn-secondary',
        Processing: 'btn-warning',
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
