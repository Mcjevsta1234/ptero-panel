import * as React from 'react';
import { useStoreState } from 'easy-peasy';
import Md5 from 'md5';

interface Props {
    email?: string;
    className?: string;
}

export default ({ email, className }: Props) => {
    const useremail = useStoreState((state) => state.user.data?.email);
    return (
        <img
            src={`https://www.gravatar.com/avatar/${Md5(String(email ? email : useremail))}`}
            className={`${className} + rounded-full`}
            alt='Gravatar'
        />
    );
};
