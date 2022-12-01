const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { validationResult, matchedData } = require('express-validator');

const State = require('../models/State');
const User = require('../models/User');
const Category = require('../models/Category');
const Ad = require('../models/Ad');

module.exports = {
    getStates: async (req, res) => {
        let states = await State.find();
        res.json({states});
    },
    info: async (req, res) => {
        let token = req.query.token;

        const user = await User.findOne({token});
        const state = await State.findById(user.state);
        const ads = await Ad.find({idUser: user._id.toString()});

        let adList = [];
        for(let i in ads) {
            const cat = await Category.findById(ads[i].category);
            adList.push({ ...ads[i], category: cat.slug });
        }

        res.json({
            name: user.name,
            email: user.email,
            state: state.name,
            celular: user.celular,
            cep: user.cep,
            ads: adList
        });
    },
    dashboard: async (req,res) => {
        let token = req.query.token;

        const user = await User.findOne({token});
        const ads = await Ad.find({idUser: user._id.toString()});

        let adList = []
        let totalView = 0
        let disableAdds = 0
        let activeAdds = 0
        let totalViews = 0
        let higherViewerAdd = 0
        let higherView = []
        

        for(let i in ads) {
            adList.push({ 
                id: ads[i]._id,
                title: ads[i].title,
                images: ads[i].images,
                description: ads[i].description,
                status: ads[i].status,
                price: ads[i].price,
                views: ads[i].views
                
             });
             if(ads[i].status == 'false' ){
                disableAdds += 1
             }
             if(ads[i].status == 'true' ){
                activeAdds += 1
             }
             if(ads[i].views > 0 ){
                totalViews += ads[i].views
             }
             
        }

        

        for(let i in adList){
            higherView.push(
                 adList[i].views
            )
            higherView.sort(function(a, b){return b-a})
        }

        for(let i in adList){
            if( adList[i].views == higherView[0]){
                higherViewerAdd = adList[i]
            }
        }
        
        
        
        

        res.json({
            ads: adList,
            total: adList.length,
            disableAdds,
            activeAdds,
            totalViews,
            higherViewerAdd
        })
    },
    editAction: async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            res.json({error: errors.mapped()});
            return;
        }
        const data = matchedData(req);

        let updates = {};

        if(data.name) {
            updates.name = data.name;
        }
        if(data.celular) {
            updates.celular = data.celular;
        }
        if(data.cep) {
            updates.cep = data.cep;
        }

        if(data.email) {
            const emailCheck = await User.findOne({email: data.email});
            if(emailCheck) {
                res.json({error: 'E-mail já existente!'});
                return;
            }
            updates.email = data.email;
        }

        if(data.state) {
            if(mongoose.Types.ObjectId.isValid(data.state)) {
                const stateCheck = await State.findById(data.state);
                if(!stateCheck) {
                    res.json({error: 'Estado não existe'});
                    return;
                }
                updates.state = data.state;
            } else {
                res.json({error: 'Código de estado inválido'});
                return;
            }
        }

        if(data.password) {
            updates.passwordHash = await bcrypt.hash(data.password, 10);
        }
        
        await User.findOneAndUpdate({token: data.token}, {$set: updates});

        res.json({});
    }
};