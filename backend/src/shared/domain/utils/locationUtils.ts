import axios from 'axios';
export class LocationUtils {
    static async getCoordinates(address:string,municipality:string,country:string = 'Spain' ):Promise<{lat:number,lng:number}>{
        return new Promise(async (resolve,reject)=>{
            const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json'
            try {
                const response = await axios.get(baseUrl, {
                    params: {
                        address: `${address}, ${municipality}, ${country}`,
                        key: 'AIzaSyBmPVHY3C3Zqg9HnQiSV2M1Kywgrm3koYk'
                    }
                });
                const data = response.data;
                console.log(data)
                if (data.results && data.results[0]) {
                    const lat = data.results[0].geometry.location.lat;
                    const lng = data.results[0].geometry.location.lng;
                    resolve({ lat, lng });
                } else {
                    console.log('Address geolocation not found');
                    reject('Address geolocation not found')
                }
            } catch (error) {
                console.log('Error obtaining address geolocation', error);
                reject(error)
            }
        })
    }

}