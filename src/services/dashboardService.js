import api, { http } from './api';

export const getAdminDashboard = () => http.get('/dashboard/admin');
export const getTeacherDashboard = () => http.get('/dashboard/teacher');
export const getStudentDashboard = () => http.get('/dashboard/student');

export const getBackupSummary = () => http.get('/backup/summary');

export const exportDatabaseBackup = async ({ format = 'sql', includeAudit = true } = {}) => {
  try {
    const data = await http.get('/backup/export', {
      params: { format, includeAudit },
      responseType: 'blob',
    });

    const now = new Date().toISOString().slice(0, 19).replace(/T/, '_').replace(/:/g, '-');
    const ext = format === 'json' ? 'json' : 'sql';
    const filename = `respaldo_sgums_${now}.${ext}`;

    let blob;
    if (data instanceof Blob) {
      blob = data;
    } else if (typeof data === 'object' && data !== null) {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    } else {
      blob = new Blob([String(data ?? '')], {
        type: format === 'json' ? 'application/json;charset=utf-8' : 'application/sql;charset=utf-8',
      });
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { filename };
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed?.message) {
          throw new Error(parsed.message);
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
    throw err;
  }
};
