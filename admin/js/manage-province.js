let currentPageIndex = 1;
let pageSizeIndex = 10;

window.addEventListener('DOMContentLoaded', async function () {
    searchProvinces();

    const modalAddBtn = document.getElementById("addProvinceButton");
    modalAddBtn.addEventListener("click", function () {
        const searchStoreModal = new bootstrap.Modal(document.getElementById("addProvinceModel"));
        searchStoreModal.show();
    });

    const addProvinceBtn = document.getElementById('addProvinceBtn');
    addProvinceBtn.addEventListener('click', async function () {
        const nameInput = document.getElementById('province-name-input').value.trim();
        const errorDiv = document.getElementById('error-messages');
        const successDiv = document.getElementById('error-success');

        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');
        errorDiv.textContent = '';
        successDiv.textContent = '';

        if (!nameInput) {
            errorDiv.textContent = 'Vui lòng nhập tên tỉnh/thành phố!';
            errorDiv.classList.remove('d-none');
            return;
        }

        await addProvince(nameInput, errorDiv, successDiv);
    });
});

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    currentPageIndex = 1
    searchProvinces(currentPageIndex, pageSizeIndex);
});

async function addProvince(nameInput, errorDiv, successDiv) {
    const url = `${API_BASE_URL}Provinces`;

    try {
        if (!nameInput || typeof nameInput !== 'string') {
            throw new Error('Tên tỉnh/thành phố không hợp lệ!');
        }

        const response = await apiRequest(url, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nameInput)
        });

        if (response.ok) {
            successDiv.textContent = 'Thêm mới tỉnh/thành phố thành công!';
            successDiv.classList.remove('d-none');

            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProvinceModel'));
                modal.hide();
                searchProvinces(currentPageIndex, pageSizeIndex);
            }, 1500);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.errors.name[0] || 'Thêm mới thất bại!');
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Đã có lỗi xảy ra!';
        errorDiv.classList.remove('d-none');
    }
}

async function searchProvinces(pageNumber = 1, pageSize = 10) {
    const byName = document.querySelector("input[name='byName']").value;

    const url = `${API_BASE_URL}Provinces?PageNumber=${pageNumber}&PageSize=${pageSize}&provinceName=${encodeURIComponent(byName)}`;

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
            throw new Error('Không thể lấy dữ liệu người dùng');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

function updateTable(provinces, pageNumber, totalPages) {
    const tableBody = document.querySelector(".table-border-bottom-0");
    tableBody.innerHTML = '';

    if (Array.isArray(provinces) && provinces.length > 0) {
        provinces.forEach(province => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td></td>
                <td><strong>${province.id}</strong></td>
                <td>${province.name}</td>
                <td></td>
                <td>
                    <a href="#" class="btn btn-icon text province-update-btn" data-province-id="${province.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </a>
                    <a href="#" class="btn btn-icon text-danger province-delete-btn" data-province-id="${province.id}" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </td>
            `;

            tableBody.appendChild(row);
        });

        attachUpdateEventListeners();
        attachDeleteEventListeners();

        updatePaginationProvince(pageNumber, totalPages);
    } else {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">Không có dữ liệu</td>`;
        tableBody.appendChild(noDataRow);
    }
}

function attachUpdateEventListeners() {
    const updateButtons = document.querySelectorAll(".province-update-btn");
    updateButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();
            const provinceId = this.getAttribute('data-province-id');
            await updateProvinceDetail(provinceId);
        });
    });
}

function attachDeleteEventListeners() {
    const deleteButtons = document.querySelectorAll(".province-delete-btn");
    deleteButtons.forEach(button => {
        button.addEventListener("click", async function (e) {
            e.preventDefault();
            const provinceId = this.getAttribute('data-province-id');
            await deleteProvince(provinceId);
        });
    });
}

async function deleteProvince(provinceId) {
    const delProvinceModel = new bootstrap.Modal(document.getElementById("delProvinceModel"));
    delProvinceModel.show();

    const deleteProvinceBtn = document.getElementById('deleteProvinceBtn');
    const provinceNameInput = document.getElementById('province-name-del');
    const errorDivDel = document.getElementById('del-error-messages');
    const successDivDel = document.getElementById('del-error-success');

    try {
        const url = `${API_BASE_URL}Provinces/${provinceId}`;
        const response = await apiRequest(url, {
            method: 'GET',
            headers: { 'Accept': '*/*' }
        });

        if (response.ok) {
            const provinceData = await response.json();
            provinceNameInput.value = provinceData.name ?? '';
        } else {
            throw new Error('Không thể lấy thông tin tỉnh/thành phố');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API chi tiết tỉnh:', error);
        // Hiển thị thông báo lỗi
        errorDivDel.textContent = 'Lỗi khi tải thông tin tỉnh/thành phố.';
        errorDivDel.classList.remove('d-none');
    }

    deleteProvinceBtn.addEventListener('click', async function () {
        errorDivDel.classList.add('d-none');
        successDivDel.classList.add('d-none');
        errorDivDel.textContent = '';
        successDivDel.textContent = '';

        const provinceName = provinceNameInput.value.trim();

        if (!provinceName) {
            errorDivDel.textContent = 'Tên tỉnh/thành phố không hợp lệ!';
            errorDivDel.classList.remove('d-none');
            return;
        }

        try {
            const deleteUrl = `${API_BASE_URL}Provinces/${provinceId}`;
            const deleteResponse = await apiRequest(deleteUrl, {
                method: 'DELETE',
                headers: { 'Accept': '*/*' }
            });

            if (deleteResponse.ok) {
                successDivDel.textContent = 'Xóa tỉnh/thành phố thành công!';
                successDivDel.classList.remove('d-none');
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('delProvinceModel'));
                    modal.hide();
                    location.reload();
                }, 1000);
            } else {
                const errorText = await deleteResponse.text();
                throw new Error(errorText || 'Xóa thất bại!');
            }
        } catch (error) {
            errorDivDel.textContent = error.message || 'Đã có lỗi xảy ra!';
            errorDivDel.classList.remove('d-none');
        }
    });
}

function updatePaginationProvince(currentPage, totalPages) {
    const paginationContainer = document.querySelector('#province-pagination .pagination');

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
        if (currentPage > 1) searchProvinces(1, pageSizeIndex);
    };
    prevPageButton.querySelector('a').onclick = () => {
        if (currentPage > 1) searchProvinces(currentPage - 1, pageSizeIndex);
    };
    nextPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchProvinces(currentPage + 1, pageSizeIndex);
    };
    lastPageButton.querySelector('a').onclick = () => {
        if (currentPage < totalPages) searchProvinces(totalPages, pageSizeIndex);
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
            searchProvinces(page, pageSizeIndex);
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

async function updateProvinceDetail(provinceId) {
    localStorage.setItem('provinceId', provinceId);
    window.location.href = 'manage-province-update.html';
}
