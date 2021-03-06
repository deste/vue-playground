import Vue from 'vue';


export default {
    
    signin: ({ commit, dispatch }, { email, password }) => {
        
        Vue.http.post('auth/signin', { email, password })
            .then(response => response.json())
            .then(data => {
                if (data) {
                    dispatch('getLoggedUser', { token: data.token, refresh_token: data.refreshToken });
                } else {
                    commit('AUTH_SIGNOUT', "Error on server response.");    
                }
            })
            .catch(response => {
                commit('AUTH_SIGNOUT', response.statusText);
            });
    },
    
    signup: ({ commit, dispatch }, { email, password }) => {
        
        Vue.http.post('auth/signup', { email, password })
            .then(response => response.json())
            .then(data => {
                if (data) {
                    dispatch('getLoggedUser', { token: data.token, refresh_token: data.refreshToken });
                } else {
                    commit('AUTH_SIGNOUT', "Error on server response.");    
                }
            })
            .catch(response => {
                commit('AUTH_SIGNOUT', response.statusText);
            });
    },
        
    signout: ({ commit }) => {
        commit('AUTH_SIGNOUT');
    },

    getLoggedUser: ({ commit }, params) => {
        
        const token = params ? params.token : window.localStorage.getItem('token');
        const refresh_token = params ? params.refresh_token : window.localStorage.getItem('refresh_token');
        
        if (refresh_token) {
            Vue.http.get('auth/loggedin', {headers: {'authorization': token}})
                .then(response => response.json())
                .then(data => {
                    if (data) {
                        commit('AUTH_SIGNIN', [token, refresh_token, data.user]);
                    } else {
                        commit('AUTH_SIGNOUT', "Error on server response.");    
                    }
                })
                .catch(response => {
                    commit('AUTH_SIGNOUT', response.statusText);
                });
        }
    },
    
    checkExpiredToken: ({ dispatch }, { response, request }) => {
        
        return new Promise(function(resolve, reject) {
            
            //If token is expired, refresh token, resubmit original request & resolve response for original request
            if(response.status === 401 
                && response.data.error 
                && response.data.error.code === 'TOKEN_EXPIRED' 
                && window.localStorage.getItem('refresh_token')) {
                
                window.localStorage.removeItem('token');
                
                dispatch('refreshToken', request).then(function(response){
                    resolve(response);
                });
            } else {
                // Otherwise just resolve the current response
                resolve(response);
            }
        });
    },
    refreshToken: ({ dispatch }, request) => {
        return new Promise(function(resolve, reject) {
            
            //Refresh token
            Vue.http.post('auth/token/refresh', { 
                token: window.localStorage.getItem('refresh_token')
            }).then(function (response) {
                
                //Store refreshed token
                window.localStorage.setItem('token', response.data.token);
                
                //Resubmit original request and resolve the response
                Vue.http(request).then(function (newResponse) {
                    resolve(newResponse);
                });
                
            }, function (newResponse) {
                reject(newResponse);
            });
        });
    }

}