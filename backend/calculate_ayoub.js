const mysql = require('mysql2');
const db = mysql.createConnection({host: 'localhost', user: 'root', password: '', database: 'pfe_grh_db'});

const teacherId = 27;

const sessionsQuery = "SELECT * FROM academic_sessions WHERE teacher_id = ?";
const statsQuery = "SELECT u.volume_horaire, u.created_at, (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND date >= DATE(u.created_at)) as total_absences, (SELECT COUNT(*) FROM absences WHERE teacher_id = u.id AND (justification_status IS NULL OR justification_status != 'Accepted') AND date >= DATE(u.created_at)) as unjustified_count FROM users u WHERE u.id = ?";

db.query(sessionsQuery, [teacherId], (err, sessions) => {
    if (err) return console.error(err);
    db.query(statsQuery, [teacherId], (err, statsResult) => {
        if (err) return console.error(err);
        
        const teacherStats = statsResult[0];
        const teacherCreatedAt = new Date(teacherStats.created_at);
        teacherCreatedAt.setHours(0,0,0,0);
        
        const today = new Date();
        const semesterStart = new Date(today.getFullYear(), 0, 1);
        const actualStart = teacherCreatedAt > semesterStart ? teacherCreatedAt : semesterStart;
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentHour = today.getHours() + today.getMinutes() / 60;

        let completedSessionsCount = 0;
        let completedExtraCount = 0;

        sessions.forEach(s => {
            const [eh, em] = s.end_time.split(':').map(Number);
            const sessionEndHour = eh + em/60;

            if (s.session_date) {
                const sDate = new Date(s.session_date);
                const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const sessionDateNoTime = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate());

                if (sessionDateNoTime < todayNoTime || (sessionDateNoTime.getTime() === todayNoTime.getTime() && sessionEndHour <= currentHour)) {
                    if (!s.is_extra) completedSessionsCount++;
                    else completedExtraCount++;
                }
            } else {
                const targetDayIndex = daysOfWeek.indexOf(s.day_of_week);
                let tempDate = new Date(actualStart);
                while (tempDate <= today) {
                    if (tempDate.getDay() === targetDayIndex) {
                        if (tempDate.toDateString() === today.toDateString()) {
                            if (sessionEndHour <= currentHour) {
                                if (!s.is_extra) completedSessionsCount++;
                                else completedExtraCount++;
                            }
                        } else {
                            if (!s.is_extra) completedSessionsCount++;
                            else completedExtraCount++;
                        }
                    }
                    tempDate.setDate(tempDate.getDate() + 1);
                }
            }
        });

        const actualDone = completedSessionsCount - (teacherStats.unjustified_count || 0);
        
        console.log({
            teacher: "Ayoub",
            completedSessionsCount,
            completedExtraCount,
            unjustified_count: teacherStats.unjustified_count,
            actualDone,
            total_absences: teacherStats.total_absences
        });
        db.end();
    });
});
