const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
        
        const page = parseInt(req.query.page, 10) || 1; // getting the 'page' value
        const limit  = parseInt(req.query.limit, 10) || 10; // getting the 'limit' value
        const startIndex  = (page - 1) * limit; // this is how we would calculate the start index  
        const endIndex  =  (page * limit); // this is how we would calculate the end index        
                
        const users = await User.aggregate([  
          {
              $lookup: {
                from: 'posts',     //collection name
                localField: '_id',
                foreignField: 'userId',
                as: 'posts'      //alias
              },
            
          },   
          { 
            $addFields: {posts: {$size: "$posts"}}
          },
          { $project : { __v: 0,} },
          {$skip: startIndex },
          {$limit: limit } 
        ]);
        const total = await User.countDocuments();
        let pageObj={}  
        pageObj.page=page
        pageObj.limit=limit
        pageObj.startIndex=startIndex
        pageObj.endIndex=endIndex
        pageObj.total=total;
        pageObj.users=users ;
        const data=this.getPagination(pageObj);        
        res.status(200).json({data});

  } catch (error) {
    console.log(error)
    res.send({ error: error.message });
  }
};


exports.getPagination=(pageObj) =>{
      
      const { limit, page,startIndex,endIndex,total,users } = pageObj
      const pagingCounter = limit * (page - 1) + 1;
      const pagination = {};
      pagination.totalDocs= total
      pagination.limit= limit,
      pagination.page=page,
      pagination.totalPages= Math.ceil(total/limit);
      pagination.pagingCounter=pagingCounter
      const hasAnythingNext=startIndex > 1 && users.length > 0 && (total - (limit * page) > 0 )
      if (startIndex > 0 )
      {        
        pagination.hasPrevPage = startIndex > 1 ? true: false
        pagination.hasNextPage = hasAnythingNext ? true: false
        pagination.prevPage = startIndex > 1 ?  page - 1 : null
        pagination.nextPage = hasAnythingNext ? page + 1 : null
      }
      else
      {             
        pagination.hasPrevPage = false
        pagination.hasNextPage = true
        pagination.prevPage = null
        pagination.nextPage = page + 1
      }

      const data = {         
        users: users,
        pagination
      }
     
      return data;
}