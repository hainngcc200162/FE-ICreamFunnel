let currentPageIndex = 1;
let pageSizeIndex = 10;

window.addEventListener('DOMContentLoaded', async function () {
    await getProfileData();
    loadProvinces();

    const provinceSelect = document.getElementById('province-select');
    const subdistrictSelect = document.getElementById('subdistrict-select');
    const storeSelect = this.document.getElementById('store-select');

    subdistrictSelect.disabled = true;
    storeSelect.disabled = true;

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

    searchOrders(currentPageIndex, pageSizeIndex);
});


document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPageIndex = 1;
    searchOrders(currentPageIndex, pageSizeIndex);
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

async function searchOrders(pageNumber = 1, pageSize = 10) {
    const provinceId = document.getElementById('province-select').value;
    const subdistrictId = document.getElementById('subdistrict-select').value;
    const storeId = document.getElementById('store-select').value;
    const orderCode = document.getElementById('orderCode').value.trim();
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const status = document.getElementById('status').value;
    const isPaidStr = document.getElementById('isPaid').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    let url = `${API_BASE_URL}Order/history/admin?PageNumber=${pageNumber}&PageSize=${pageSize}`;

    if (provinceId) url += `&provinceId=${provinceId}`;
    if (subdistrictId) url += `&subdistrictId=${subdistrictId}`;
    if (storeId) url += `&storeId=${storeId}`;
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
    0: 'btn-secondary',
    1: 'btn-warning',
    2: 'btn-success',
    3: 'btn-danger'
};

const nbsp = '\u00A0';

const statusVNMap = {
    0: 'ĐÃ XÁC NHẬN',
    1: 'ĐANG XỬ LÝ' + nbsp + nbsp + nbsp + nbsp,
    2: 'HOÀN TẤT' + nbsp + nbsp + nbsp + nbsp + nbsp + nbsp + nbsp + nbsp,
    3: 'ĐÃ HỦY ĐƠN' + nbsp + nbsp + nbsp
};

function updateTable(orders, pageNumber, totalPages) {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';

    if (Array.isArray(orders) && orders.length > 0) {
        orders.forEach(order => {
            const row = document.createElement('tr');
            const statusClass = statusClassMap[order.status] || 'btn-primary';
            const statusText = statusVNMap[order.status] || 'Chưa xác định';
            row.dataset.orderCode = order.orderCode;
            row.dataset.id = order.id;

            row.innerHTML = `
                <td>${order.orderCode}</td>
                <td>${order.storeName}</td>
                <td>${order.customerName}</td>
                <td>${order.customerPhone}</td>
                <td>${order.orderDate ? formatDate(order.orderDate) : ''}</td>

                <td class="">
                    <button type="button" class="btn ${statusClass} btn-fixed-width">${statusText}</button>
                </td>
            `;

            attachRowClickHandler(row);
            tableBody.appendChild(row);
        });

        updatePaginationOrder(pageNumber, totalPages);
    } else {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">KHÔNG CÓ DỮ LIỆU</td>`;
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

                const modalElement = document.getElementById('orderDetailAdminModal');
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
        });
    });
}

const statusVNMapModal = {
    Confirmed: 'ĐÃ XÁC NHẬN',
    Processing: 'ĐANG XỬ LÝ',
    Completed: 'ĐÃ HOÀN THÀNH',
    Cancelled: 'ĐÃ HỦY'
};

function fillOrderModal(data) {
    document.getElementById('orderCodeModal').textContent = data.orderCode || '—';
    document.getElementById('provinceNameModal').textContent = data.provinceName || '—';
    document.getElementById('subdistrictNameModal').textContent = data.subdistrictName || '—';
    document.getElementById('storeNameModal').textContent = data.storeName || '—';
    document.getElementById('verificationCodeModal').textContent = data.verificationCode || '—';
    document.getElementById('orderDateModal').textContent = new Date(data.orderDate).toLocaleString('vi-VN') || '—';
    document.getElementById('customerNameModal').textContent = data.customerName || '—';
    document.getElementById('customerPhoneModal').textContent = data.customerPhone || '—';
    document.getElementById('customerEmailModal').textContent = data.customerEmail || '—';
    document.getElementById('noteModal').textContent = data.note || '—';
    document.getElementById('isPaidModal').textContent = data.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán';
    document.getElementById('paidDateModal').textContent = new Date(data.paidAt).toLocaleString('vi-VN') || '—';

    const statusEl = document.getElementById('statusModal');
    const status = data.status;

    statusEl.textContent = statusVNMapModal[status] || '—';
    statusEl.className = '';

    if (status === 'Completed') {
        statusEl.classList.add('text-success', 'fw-bold');
    } else if (status === 'Processing') {
        statusEl.classList.add('text-warning', 'fw-bold');
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

function updateBtnGroupClass(status, btnGroupId) {
    const statusClassMap = {
        0: 'btn-secondary',
        1: 'btn-warning',
        2: 'btn-success',
        3: 'btn-danger'
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
