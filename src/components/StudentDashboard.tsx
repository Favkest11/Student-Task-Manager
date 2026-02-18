import { supabase } from '../lib/supabase';
import { useState,useEffect} from 'react'
function StudentDashboard()
{

    return(
        <div>
            <h1>Student</h1>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>

        </div>
    )
}

export default StudentDashboard;