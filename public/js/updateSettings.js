import axios from 'axios';
import { hideAlert, showAlert } from './alert';

export const updateData = async (name, email) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: '/api/v1/users/updateMe',
            data: {
                name,
                email,
            },
        });

        if (res.data.status === 'success') {
            showAlert('success', 'Updated successfully');
            location.reload(true);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

export const updatePassword = async (
    currentPassword,
    newPassword,
    confirmPassowrd
) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: '/api/v1/users/updateMyPassword',
            data: {
                currentPassword: currentPassword,
                newPassword: newPassword,
                newPasswordConfirm: confirmPassowrd,
            },
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Updated successfully');
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};
